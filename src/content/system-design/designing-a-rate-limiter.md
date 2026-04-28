---
title: "Designing a Rate Limiter (at Scale, Production-Grade)"
description: "Design a limiter that is actually deployable: low-latency enforcement, burst handling, distributed quotas, multi-region coordination, and failure-safe behavior."
date: 2026-04-27
tags: ["rate-limiting", "token-bucket", "sliding-window", "redis", "multi-region", "control-plane"]
draft: false
family: "traffic-management"
kind: "end-to-end-design"
difficulty: "advanced"
prerequisites: []
related: ["idempotency-and-retries", "feature-flags-control-plane"]
enables: ["global-quotas", "load-shedding"]
---

## Problem

Build a **production-grade rate limiter** for a large API platform.

This is not the toy version where one process keeps a map from user to counter. The real design has to answer much harder questions:

- how do you enforce limits at **single-digit millisecond latency**?
- how do you define limits per **user, tenant, token, IP, endpoint, region, and request cost**?
- how do you absorb **bursts** without turning the limiter into a denial-of-service amplifier?
- how do you keep enforcement mostly correct across **many instances and many regions**?
- what happens when the backing store is slow, unavailable, partitioned, or hot-spotted?
- how do you let product and abuse teams change policies without redeploying the whole fleet?

In senior interviews, a strong answer is not just “use Redis and token bucket.” It is a design that is explicit about the **request path**, **control plane**, **storage model**, **failure mode**, and **operational trade-offs**.

## Goals

Assume the limiter must support:

1. **Very low request-path latency**. A limiter that adds 20 ms to every request is already harming the service it is supposed to protect.
2. **High write volume**. Every allowed request may mutate state.
3. **Burst tolerance**. Clients often need short spikes without violating long-term quotas.
4. **Hierarchical policies**. Example: per-IP, per-user, per-API-key, per-tenant, and global service caps.
5. **Multiple algorithms**. Some products want strict windows, some want burstable buckets, some want concurrency limits.
6. **Regional isolation**. A failure in one region should not globally disable traffic control.
7. **Safe degradation**. On dependency failure, the system needs a well-defined fail-open or fail-closed policy.
8. **Observability and auditability**. Operators need to understand why requests were rejected and what policy version made the decision.

## Non-goals

Do not promise impossible things:

- **perfect global linearizability** at planetary scale and microsecond latency
- **zero cost** for every update and every dimension
- **infinite-cardinality tracking** with no memory planning

Every serious limiter picks where it wants stronger correctness and where it accepts approximation.

## First principles: what is a rate limit?

A rate limit is a policy over a key and a time function.

Formally, you can think of a rule like:

```text
subject = f(request)
cost = g(request)
allow iff usage(subject, policy, now) + cost <= budget(policy, now)
```

The hard part is not the inequality. The hard part is the design of:

- `subject`
- `usage`
- `budget`
- `now`
- the consistency model around all of them

For example, the same platform may need:

- `100 requests / second / IP`
- `10,000 requests / minute / tenant`
- `500 writes / minute / user`
- `50 MB / second / token`
- `20 concurrent uploads / account`

That is why the API must support **dimensioned policies**, not one flat integer limit.

## Candidate algorithms

Before architecture, pick the enforcement model.

### Fixed window counter

Track a counter per `(key, windowStart)`.

Example:

```text
key = "tenant:123"
window = floor(now / 60s)
counter["tenant:123:2026-04-27T21:05"] += 1
```

**Advantages**

- trivial to implement
- compact storage
- easy to shard

**Problems**

- boundary effect: `100 requests` at `12:00:59.900` and `100 more` at `12:01:00.100` is effectively `200` in ~200 ms
- not ideal when strict smoothness matters

Use this when quotas are coarse and the product can tolerate burstiness near boundaries.

### Sliding log

Store every event timestamp and drop those outside the horizon.

**Advantages**

- most accurate representation of “N events in the last T seconds”

**Problems**

- expensive in memory and write amplification
- impractical for high-cardinality hot keys unless the rate is low

Good for small-scale strict policies, not as the universal primitive for a large public API.

### Sliding window counter

Approximate the sliding log by combining the current and previous windows.

Example:

```text
effective = currentWindowCount + previousWindowCount * overlapFraction
```

**Advantages**

- much better smoothing than fixed windows
- far cheaper than logs

**Problems**

- still approximate
- more arithmetic and multiple counter reads

This is a solid choice for abuse controls that care about smoother recent activity.

### Token bucket

Each key owns:

- a token balance
- a last-refill timestamp
- a refill rate
- a max capacity

Requests consume tokens; time refills them.

**Advantages**

- naturally supports bursts
- easy mental model for “average rate with burst budget”
- compact state
- very common in production because it is fast and stable

**Problems**

- not the same as a strict “N in the last T seconds” policy
- requires careful timestamp handling and atomic update logic

For general API protection, **token bucket is usually the best primary enforcement primitive**.

### Leaky bucket / paced queue

Enforce an output rate by draining at a constant rate.

This is stronger for shaping than simple rejection, but it turns the limiter into a queueing system and increases tail latency. For an API gateway, that is often the wrong default unless the product explicitly prefers buffering over rejection.

## Recommended enforcement choice

For a production platform, the best answer is usually:

1. **token bucket** for the main request-path decision
2. **optional sliding-window counters** for abuse and anomaly rules
3. **concurrency limits** as a separate primitive for operations that hold scarce resources

That combination handles the majority of practical requirements:

- smooth long-term quota
- controlled bursts
- low state footprint
- reasonable multi-region strategies

## High-level architecture

Split the system into three logical planes:

1. **data plane / request path**
2. **state plane / fast quota state**
3. **control plane / policy management**

```text
client
  -> edge gateway / service mesh / API frontend
      -> local limiter library
          -> fast state store (regional)
      -> upstream service

policy authoring UI / admin API
  -> policy service
      -> policy database
      -> config distribution stream / cache refresh

analytics pipeline
  <- allow / deny decision stream
  <- sampled request metadata
```

### Why the split matters

Many weak designs collapse everything into one service:

- request evaluation
- config storage
- metrics
- analytics
- UI

That looks simpler on the board, but it is the wrong production shape. The request path must stay lean and dependency-minimal. Analytics and dashboards are not allowed to sit in the critical path of `allow()` decisions.

## Request-path design

The limiter should usually live at one of these points:

1. **API gateway / ingress**
2. **service mesh sidecar**
3. **embedded library inside the application**

For external APIs, gateway enforcement is the strongest baseline because:

- it protects downstream systems before work is done
- it centralizes public-facing policy
- it avoids requiring every service team to implement the same logic badly

For internal systems, a local library or sidecar can complement gateway limits with service-specific protections.

### Request-path steps

On each request:

1. extract identity dimensions
2. load applicable policy from local in-memory cache
3. build one or more rate-limit keys
4. evaluate keys against the fast state store
5. reject if any hard limit is exceeded
6. attach rate-limit headers and structured decision metadata
7. asynchronously emit logs / metrics / samples

The critical path should avoid:

- remote config database lookups
- synchronous analytics writes
- large object allocations
- fan-out to many regions

## Control plane design

The control plane answers: **what are the policies?**

Store policies in a durable database such as Postgres, Spanner, or another strongly consistent configuration store.

Each policy should look conceptually like:

```json
{
  "policy_id": "tenant-write-limit-v7",
  "subject": "tenant_id",
  "match": {
    "service": "payments",
    "endpoint": "/v1/charges",
    "method": "POST"
  },
  "algorithm": "token_bucket",
  "rate": 200,
  "interval_seconds": 1,
  "burst": 400,
  "cost_expression": "request.units",
  "fail_mode": "open",
  "priority": 40,
  "enabled": true,
  "version": 7
}
```

### Important control-plane properties

#### Versioned policies

Every decision should record the policy version that was applied.

Without that, operators cannot answer:

- why did traffic start getting denied?
- which rollout introduced the behavior change?
- which instances are still on the old config?

#### Push plus pull refresh

Use a hybrid:

- **push** to distribute changes quickly
- **periodic pull / revalidation** so stale nodes recover even if a push was missed

Examples:

- Kafka / PubSub / NATS stream of config changes
- xDS-style config distribution
- polling a version endpoint every few seconds

#### Local compiled policy cache

Do not interpret raw policy JSON on every request.

Compile policies into a fast local representation:

- ordered match tree
- pre-parsed matchers
- resolved cost rules
- pre-built key templates

That turns the request path into predictable in-memory operations.

## State-plane design

The state plane answers: **how much of the budget is left right now?**

This is the hardest part.

You have three common choices:

1. in-process memory only
2. distributed in-memory store, usually Redis
3. custom state service on top of a key-value store

### Option 1: in-process only

This is extremely fast but only correct per process.

If you have 100 stateless API instances and each allows `100 req/s`, then a nominal `100 req/s` tenant can effectively get `10,000 req/s` unless requests are perfectly sticky.

You can still use local memory as a **secondary micro-cache** or a **leased local budget**, but not as the sole source of truth for a shared public limit.

### Option 2: Redis as the fast shared state

This is the standard production answer because Redis gives:

- low latency
- atomic server-side logic via Lua
- TTL support
- mature operations model

For most interviews and many real systems, **regional Redis + server-side atomic scripts** is the best core design.

### Option 3: custom quota service

At very large scale, teams sometimes build a dedicated quota service over a sharded state backend. That can support more custom behavior, but it is a second-system problem. Unless there is a strong reason, do not start there.

## Key design

Key design determines both correctness and cost.

A useful key template is:

```text
rl:{policy_id}:{subject_hash}:{bucket_hint}
```

Where:

- `policy_id` separates different rules
- `subject_hash` is derived from user / tenant / IP / token / endpoint tuple
- `bucket_hint` may represent the active time bucket or region-local partition

### Why hash the subject?

Subjects can be long or sensitive:

- emails
- API tokens
- IP + path combinations

Hashing reduces key size and avoids putting raw identifiers into hot-path storage. Keep a deterministic stable hash, typically 64-bit or 128-bit.

### Watch cardinality carefully

Bad limiter designs explode state cardinality by tracking dimensions nobody truly needs.

Example anti-pattern:

```text
key = user_id + IP + endpoint + method + device_id + user_agent + region
```

That may create huge sparse keyspaces and destroy cache efficiency.

Track only the dimensions that correspond to real policy semantics.

## Token bucket state model

For each key, store:

```text
tokens
last_refill_ms
```

Policy parameters are usually not stored in the key itself; they come from the control-plane cache:

```text
capacity
refill_rate_per_ms
cost
```

### Atomic update

The decision must be atomic:

1. read current state
2. compute refill since `last_refill_ms`
3. cap at `capacity`
4. compare against `cost`
5. if allowed, decrement
6. write new state and TTL

With Redis, do this in a Lua script so the computation executes server-side as one operation.

### Pseudocode

```lua
-- inputs:
-- key
-- now_ms
-- capacity
-- refill_per_ms
-- cost
-- ttl_ms

local data = redis.call("HMGET", key, "tokens", "last")
local tokens = tonumber(data[1])
local last = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  last = now_ms
end

local elapsed = math.max(0, now_ms - last)
local refilled = math.min(capacity, tokens + elapsed * refill_per_ms)
local allowed = 0
local remaining = refilled

if refilled >= cost then
  allowed = 1
  remaining = refilled - cost
end

redis.call("HSET", key, "tokens", remaining, "last", now_ms)
redis.call("PEXPIRE", key, ttl_ms)

return {allowed, remaining}
```

The TTL should be long enough to preserve idle buckets that might become active soon, but short enough that dead keys disappear automatically. A common rule is a few multiples of the refill horizon.

## Why TTL matters

Suppose capacity is `1000` and refill is `100 tokens/s`.

An idle key does not need to live forever. Once it has had enough idle time to refill completely, old state is no longer interesting. If the bucket would become full after `10s`, then a TTL of `30s` or `60s` is often sufficient.

TTL is how you avoid unbounded growth for dormant subjects.

## Handling multiple limits per request

Real requests often need more than one rule.

Example for a single call:

- per-IP limit
- per-user limit
- per-tenant limit
- global endpoint limit

The request should be **denied if any hard limit denies**.

### Evaluation order

Check the cheapest / broadest / most likely-to-fire rules first:

1. hot local denies or temporary bans
2. coarse global protection
3. per-tenant and per-user limits
4. exotic cost-based rules

This reduces unnecessary writes when an earlier rule already rejects the request.

### Atomicity across multiple keys

This is tricky.

If one request touches 4 keys, do you need cross-key atomicity?

Usually:

- **within one key**: yes
- **across all keys**: not fully, unless you are willing to pay much higher cost

A practical strategy is:

1. evaluate keys in deterministic order
2. stop on first deny
3. accept tiny cross-key inconsistency rather than introducing distributed transactions

For example, two concurrent requests may both pass a global check and then each consume a user-local check, slightly overshooting one policy by a small amount. That is often acceptable if the limiter is fundamentally a protection system rather than a billing ledger.

If you need billable hard quotas, the design shifts toward a stronger quota service with more serialized enforcement.

## Redis deployment shape

The safe default is **regional Redis clusters**.

Each region enforces its own request-path limits against a low-latency local cluster.

Why regional?

- cross-region round trips are too expensive for the critical path
- a limiter should not create a global dependency for every request
- regional outages should not take down global admission control

### Sharding

Shard by key hash.

This avoids routing every request for one tenant through every node, but you still need to prepare for **hot keys**, where one tenant or endpoint dominates traffic.

### Hot-key mitigations

1. **key salting with local aggregation**
2. **hierarchical limits**
3. **leased local budgets**
4. **dedicated shard class for very hot tenants**

The best production answer is often **leased local budgets**.

## Local budget leasing

If every request hits Redis, the backend becomes both expensive and a new bottleneck.

To reduce write pressure, let each gateway instance lease a local slice of the budget.

### Example

Global regional limit:

```text
tenant 123: 10,000 req/s
```

Instead of asking Redis for every request, an instance reserves:

```text
500 tokens
```

and then spends those locally in process until it needs another lease.

### Benefits

- much lower Redis QPS
- much lower tail latency
- better resilience to short store hiccups

### Trade-off

You introduce bounded overshoot.

If 20 instances each hold 500 tokens, a crashing or partitioned fleet can overshoot the nominal regional budget by up to roughly the sum of outstanding leases.

That is why lease size must be proportional to:

- tolerated overshoot
- instance count
- request volatility

This is a very strong senior-level point: **you can buy latency and scale by explicitly budgeting overshoot**.

## Global limits across regions

Now the hardest version:

> “Limit this tenant to 100,000 req/s worldwide, across 8 regions.”

You have three broad options.

### Option A: one global strongly consistent store

This gives the strongest correctness but terrible request-path latency and terrible blast radius. It is almost never the right default for high-throughput APIs.

### Option B: fully independent regional enforcement

Each region gets the whole limit or a static fraction.

Example:

```text
global quota = 100k req/s
8 regions each get 12.5k req/s
```

This is simple but wasteful when traffic distribution is uneven.

### Option C: budget allocation service

This is the practical production answer.

Use a slower **global allocator** that periodically issues regional budgets, then let each region enforce locally.

```text
global budget
  -> regional budget
      -> node-local lease
          -> individual request
```

This creates a hierarchy of enforcement:

1. global allocator
2. regional quota store
3. instance-local lease

### Trade-off

The hierarchy sacrifices perfect instant global correctness, but keeps the critical path local.

That is usually the right decision.

## Global allocator design

The allocator can run every few hundred milliseconds or every few seconds depending on required smoothness.

Inputs:

- configured global quota
- recent regional demand
- current regional lease outstanding
- health and failover state

Outputs:

- new regional budget assignments
- optional burst reserve

### Allocation strategies

#### Static split

Simple and predictable:

```text
quota_r = global_quota * weight_r
```

Good when regions have stable traffic shares.

#### Demand-weighted split

Use recent demand:

```text
quota_r = global_quota * demand_r / sum(demand)
```

More efficient, but can oscillate if not smoothed.

#### Base + burst reserve

Give each region a baseline plus access to a central reserve.

This is useful when one region suddenly spikes.

## Multi-region correctness model

Say this explicitly in an interview:

> For global limits, I would choose **bounded eventual correctness** rather than strict per-request global serialization, because the latter makes the limiter slower and more fragile than the systems it protects.

This is exactly the kind of trade-off a senior interviewer wants to hear.

## Concurrency limits

Not every scarce resource is a rate.

Examples:

- active uploads
- in-flight report generations
- concurrent database export jobs

For these, use **permits**, not token refill math.

The state model is:

```text
current_inflight
max_inflight
lease_expiration
```

Permits need a **lease timeout** in case the request holder crashes and never returns the permit.

That is a separate primitive from token bucket, though both belong in the same rate-limiting platform.

## Clock handling

Time is dangerous in distributed systems.

If gateways and Redis disagree badly on time, refill logic becomes wrong.

Practical choices:

1. use Redis server time for server-side scripts
2. keep all nodes on disciplined NTP
3. clamp negative elapsed values to zero

If you trust gateway time blindly, clock skew can create fake refills or fake starvation.

## Failure-mode policy: fail open or fail closed?

This depends on what the limiter protects.

### Fail open

Allow traffic when the limiter backend is unavailable.

Use this for:

- user-facing APIs where availability is more important than strict quota enforcement
- best-effort fairness controls

Risk:

- abuse or overload can leak through during outages

### Fail closed

Reject traffic when enforcement cannot be proven.

Use this for:

- expensive paid APIs with hard contractual quotas
- security-sensitive or abuse-sensitive operations

Risk:

- the limiter dependency becomes availability-critical

### Best production answer

Make fail mode **policy-specific**.

For example:

- `GET /timeline`: fail open
- `POST /password-reset`: fail closed
- `LLM inference spending quota`: fail closed or partially closed

Do not hard-code one global behavior.

## Graceful degradation strategy

When Redis is slow or unavailable:

1. fall back to **small local emergency limits**
2. reduce policy richness
3. prefer local cache for known hot abusers
4. emit degraded-mode metrics loudly

This is much better than binary “works / broken”.

Example degraded behavior:

- keep using already leased local budgets
- stop taking new large leases
- apply coarse per-IP emergency caps from local memory
- mark responses with internal decision reason `DEGRADED_LOCAL_ONLY`

## Protecting the limiter from itself

A limiter can become the hottest dependency in the stack.

Design protections:

### 1. keep request-path objects tiny

Avoid large per-request allocations or complicated rule-evaluation trees.

### 2. precompute policy matches

Compile rules in advance.

### 3. separate analytics from enforcement

Emit decision events asynchronously.

### 4. backpressure the control plane

Bad config rollout storms should not melt gateways.

### 5. protect Redis from pathological fan-out

Batch where possible, use leases, and do not generate unnecessary keys.

## Abuse and adversarial behavior

A serious limiter is also part of the abuse-defense stack.

Expect:

- clients spreading traffic across many IPs
- token rotation
- endpoint hopping
- retry storms after 429s
- intentionally synchronized bursts at window boundaries

Countermeasures:

- multiple dimensions per request
- reputation signals
- stricter sliding-window abuse rules
- per-endpoint costs
- longer cooldown rules for repeated offenders

Example:

```text
login endpoint:
  per-IP
  per-account
  per-device fingerprint
  global suspicious-attempt rule
```

One dimension alone is rarely enough against motivated abuse.

## API contract and headers

Expose the limiter result cleanly.

Typical response on deny:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 12
```

Internally, also attach structured fields:

```json
{
  "decision": "deny",
  "policy_id": "tenant-write-limit-v7",
  "key_hash": "0x71cd...",
  "remaining": 0,
  "source": "redis-script",
  "mode": "normal"
}
```

Do not leak sensitive policy internals to public clients, but give enough information for sane retry behavior.

## Observability

You cannot operate a limiter blind.

Track:

### Counters

- total allows
- total denies
- decisions by policy
- degraded-mode decisions
- config version mismatches

### Latency

- request-path decision latency
- Redis script latency
- config refresh latency

### Capacity

- keys in active state
- shard memory usage
- lease issuance rate
- hot-key concentration

### Accuracy / safety signals

- estimated overshoot due to leases
- missed config refreshes
- proportion of fail-open decisions

### Tracing

Add a limiter span in request traces with:

- matched policies
- chosen dimensions
- store round trips
- final decision reason

This is extremely useful when someone claims “the gateway is randomly rejecting traffic.”

## Data retention and analytics

Do not store every request forever in the primary limiter backend.

Instead:

1. keep only live enforcement state in Redis
2. stream decision events to Kafka / PubSub
3. aggregate into ClickHouse, BigQuery, or a metrics pipeline

This gives:

- dashboards
- abuse forensics
- policy tuning
- capacity planning

without polluting the request path.

## Rollout strategy

Never launch new policies straight into hard deny.

Use phases:

1. **shadow mode**: evaluate but never reject
2. **log-only**: record hypothetical denies
3. **soft enforcement**: limited percentage or selected tenants
4. **hard enforcement**

Why this matters:

- key extraction bugs are common
- policy match rules are often broader than intended
- cost expressions can be wrong

Shadow mode turns production traffic into a validation harness.

## Capacity planning

A quick sizing exercise is high signal in an interview.

Suppose:

- 2 million requests/s globally
- average 2 applicable rules per request
- 6 regions
- 70% of traffic uses local leases, so only 30% hit Redis

Then rough state-store QPS is:

```text
2,000,000 * 2 * 0.30 = 1,200,000 state ops/s globally
```

Per region, if evenly distributed:

```text
~200,000 state ops/s / region
```

That is feasible for a properly sharded in-memory store, but it makes clear why “one Redis box” is not a serious answer.

Also estimate memory:

- active keys
- bytes per key
- replication factor
- overhead from TTL and hashes

Always talk about both **QPS** and **key cardinality**.

## Common pitfalls

### 1. putting the control-plane database in the hot path

That is a guaranteed latency and availability problem.

### 2. ignoring hot keys

Large tenants do not behave like the median tenant.

### 3. pretending global strong consistency is free

It is not. If you choose it, say what latency and availability you are paying.

### 4. forgetting retries

Clients will retry 429s, sometimes aggressively. A limiter without retry guidance and client education can trigger retry storms.

### 5. no policy versioning

Then debugging turns into folklore.

### 6. no degraded mode

A protection system that fails catastrophically under dependency failure is not production-grade.

## What a strong senior-level answer sounds like

If an interviewer asks for a rate limiter at scale, a concise but senior answer is:

> I would enforce limits at the gateway. The control plane stores versioned policies in a durable database and distributes compiled configs to gateways via push plus periodic pull. For request-path state, I would use regional Redis clusters with Lua-based atomic token-bucket updates. For high-volume tenants, I would reduce backend QPS with leased local budgets, accepting bounded overshoot. For worldwide quotas, I would not put a globally consistent dependency in the request path; I would use a slower global allocator that issues regional budgets, then enforce locally. Policies would support per-rule fail-open or fail-closed behavior, and I would roll out new rules in shadow mode first. Metrics, tracing, and decision logs would be asynchronous so the limiter stays fast even when analytics is unhealthy.

That answer demonstrates:

- algorithm choice
- system boundaries
- consistency thinking
- production operations mindset

## Decision table

| Concern | Recommended choice | Why |
|---|---|---|
| Primary request-path algorithm | Token bucket | Good burst semantics with compact state and fast atomic updates |
| Shared fast state | Regional Redis | Low latency, mature ops, atomic server-side scripts |
| Config storage | Durable DB + local compiled cache | Strong control-plane correctness without hot-path DB reads |
| High-QPS optimization | Local leased budgets | Reduces backend load while bounding overshoot |
| Global quotas | Budget allocation hierarchy | Keeps request path local and resilient |
| Failure behavior | Policy-specific fail-open / fail-closed | Availability and protection needs differ by endpoint |
| Rollout | Shadow -> soft -> hard | Prevents bad policy pushes from causing sudden outages |

## Key takeaways

- A real rate limiter is a **distributed systems product**, not a single algorithm.
- **Token bucket + regional shared state + compiled policy cache** is the strongest default shape for a large API platform.
- Multi-region “global limits” should usually be handled as **hierarchical budget allocation**, not per-request global serialization.
- **Leased local budgets** are one of the most important practical scale techniques because they cut request-path storage load dramatically.
- The design is incomplete without **failure semantics, hot-key strategy, rollout safety, and observability**.
