---
title: "Distributed Locking (Leases, Fencing Tokens, and When Not to Use It)"
description: "Design distributed locking with explicit guarantees, stale-owner protection, and realistic failure semantics instead of assuming a lock magically creates correctness."
date: 2026-04-27
tags: ["distributed-locking", "leases", "fencing", "consensus", "redis", "zookeeper"]
draft: false
family: "control-plane"
kind: "trade-off"
difficulty: "advanced"
prerequisites: []
related: ["feature-flags-control-plane", "global-quotas"]
enables: ["global-quotas"]
---

## Problem

Teams often say:

> we need a distributed lock

What they usually mean is one of several different needs:

- elect one active worker
- prevent concurrent mutation of one resource
- serialize a critical section
- avoid duplicate job execution
- coordinate ownership during failover

Those are not identical problems, and a lock is often the wrong tool.

A staff-level answer starts with:

> what guarantee do we actually need, and can we avoid a lock entirely?

## What a lock can and cannot guarantee

A distributed lock tries to give:

- **mutual exclusion**
- **liveness**
- **crash recovery**

But in real systems you must also think about:

- clock skew
- pauses from GC or scheduling
- network partitions
- stale holders resuming after lease expiry

That last one is the killer.

Even if a lease expires, the original holder may resume and still issue writes unless the protected resource can reject stale ownership.

That is why **fencing tokens** matter more than the lock itself.

## First question: can you avoid locking?

Before designing one, check cheaper alternatives:

### Idempotency

If duplicate execution is acceptable as long as side effects are deduped, use idempotency instead of exclusive ownership.

### Sharding / single-writer partitioning

If all work for a key routes to one owner, you may not need a lock.

### Compare-and-set on the resource itself

If the storage engine supports conditional updates, the resource can often protect itself directly.

### CRDT / mergeable state

If concurrent updates can be merged safely, exclusive ownership is unnecessary.

Locks are often the sign that concurrency was not modeled explicitly enough.

## When locking is justified

It can be justified when:

- one leader should run a background scheduler
- exactly one worker should hold an operational role at a time
- a scarce external resource cannot defend itself
- you need serialized reconfiguration of shared state

Even then, the design must be explicit about stale holders and recovery.

## Lease-based lock model

Never assume a lock is permanent.

Use a **lease**:

```text
resource_id
owner_id
lease_expiration
fencing_token
```

The holder must renew periodically.

If renewals stop, another owner can acquire the lease.

This handles crash recovery, but it still does not stop the old owner from acting after it wakes up.

## Fencing tokens

Every successful acquisition returns a monotonically increasing token:

```text
token = 41
```

Any write to the protected resource must include that token, and the resource must reject writes with older tokens.

Example:

1. worker A acquires lock with token `41`
2. worker A pauses for 30 seconds
3. lease expires
4. worker B acquires lock with token `42`
5. worker B writes to storage with token `42`
6. worker A wakes up and tries to write with token `41`
7. storage rejects stale token `41`

Without fencing, the stale owner can still corrupt state after losing the lock.

This is the single most important technical point in distributed locking.

## Where to store the lock

### Consensus-backed store

Examples:

- ZooKeeper
- etcd
- Consul (with caveats depending on mode)

Strengths:

- clear lease/session semantics
- linearizable operations
- suitable for leader election and coordination

Weaknesses:

- more operational complexity than a cache
- not something to put blindly in every high-QPS path

### Redis

Useful for coarse coordination or best-effort leadership, but be careful.

A single Redis instance with:

```text
SET key value NX PX ttl
```

can approximate a lease.

What it does **not** solve by itself:

- stale owner writes after expiry
- durability across failover if not configured appropriately
- correctness under ambiguous failover timing

So if Redis is used, it should generally be paired with fencing at the protected resource and used only where the residual risk is acceptable.

## Redlock and why people argue about it

The reason Redlock is controversial is not that distributed locking is impossible. It is that people often ask a caching layer to provide coordination semantics stronger than the whole system can actually enforce.

The right engineering question is:

- what are the failure assumptions?
- what is the cost of stale dual ownership?
- does the resource itself verify fencing?

If the answer is "dual ownership would corrupt money or metadata," use a coordination system with linearizable semantics and enforce fencing at the resource boundary.

## Lock acquisition flow

With a consensus-backed lease service:

1. create or renew a session
2. try to acquire resource key under that session
3. receive fencing token
4. perform protected work while renewing session
5. release or let session expire

Pseudocode:

```text
lease = coordinator.acquire(resource_id, owner_id)
token = lease.fencing_token

while work_remaining:
    coordinator.renew(lease)
    write(resource, token, mutation)

coordinator.release(lease)
```

The resource write must compare the token against the highest token it has accepted.

## Resource-side enforcement

This is the hard requirement many designs miss.

The lock service alone cannot guarantee safety if:

- the client pauses
- the network partitions
- the client continues writing after lease loss

The **resource itself** must reject stale owners.

Examples:

### SQL row

```sql
UPDATE jobs
SET owner_token = :token, state = :new_state
WHERE job_id = :id AND owner_token < :token;
```

### Object store metadata

Store highest token in metadata and reject lower tokens.

### Downstream service

Require `X-Fencing-Token` header and compare against stored max token.

## Leader election is just specialized locking

For one active scheduler:

- elect leader with lease
- followers stay idle
- leader renews session
- on lease loss, leader stops acting immediately

Important: the leader must stop doing work on uncertainty, not just on explicit revocation.

If the renewal path is unhealthy or ambiguous, keep working only if the safety model explicitly allows split brain. Usually it should not.

## Time and renewal

Lease renewal interval should be much shorter than lease duration.

Example:

```text
lease duration = 15s
renew every 5s with jitter
```

Why shorter?

- allows multiple missed renewals before expiry
- reduces false leadership loss due to transient blips

But if the lease is too long:

- failover is slow

If it is too short:

- benign pauses trigger churn

This is a classic safety vs failover-latency trade-off.

## Common anti-patterns

### 1. lock without fencing

This is the biggest one.

### 2. assuming process-local unlock always happens

Crash and pause are normal failure modes.

### 3. using a lock to hide missing idempotency

Usually the wrong abstraction.

### 4. placing locking in a high-QPS request path

Lock services are coordination tools, not generic data-plane databases.

### 5. treating "I wrote a key in Redis" as the whole correctness argument

It is not.

## Observability

Track:

- acquisition latency
- renewal failures
- lease loss count
- dual-owner suspicion events
- stale-token write rejections
- lock hold duration

If stale-token rejections spike, either pause times are large or lease durations are wrong.

## What the senior answer sounds like

> I would avoid distributed locking unless the problem truly requires exclusive ownership. If it does, I would model it as a lease plus fencing token, not as a magical mutex. The coordinator should give monotonically increasing fencing tokens, and the protected resource must reject writes from stale holders using those tokens. That is what protects correctness under pause, partition, and delayed delivery. For high-value coordination like leader election or serialized control-plane mutation, I would prefer a consensus-backed store with explicit session semantics. Redis can be acceptable for best-effort coordination, but only when the residual stale-owner risk is acceptable and the resource still enforces fencing.

## Key takeaways

- The real problem is rarely "get a lock"; it is **define the guarantee and failure model**.
- A lease without **fencing tokens** does not stop stale owners from writing.
- Prefer **idempotency, sharding, or conditional writes** when they solve the problem more directly.
- Use consensus-backed coordination for strong safety needs; use Redis only with eyes open.
- Keep locking off the hot path unless coordination itself is the product.
