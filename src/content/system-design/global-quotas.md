---
title: "Global Quotas (Hierarchical Budgets Across Regions and Fleets)"
description: "Design worldwide quotas without putting a globally serialized dependency in the request path, using hierarchical allocation, leased budgets, and bounded overshoot."
date: 2026-04-27
tags: ["global-quotas", "budget-allocation", "multi-region", "hierarchical-limits", "leases", "fairness"]
draft: false
family: "traffic-management"
kind: "end-to-end-design"
difficulty: "advanced"
prerequisites: ["designing-a-rate-limiter", "distributed-locking"]
related: ["feature-flags-control-plane", "feedback-control-for-autoscaling-and-load-shedding", "load-shedding"]
enables: []
---

## Problem

A local rate limiter is easy compared with this requirement:

> limit tenant `T` to 5 million requests per minute worldwide across 10 regions and thousands of instances

The naive answer is:

> keep one global counter and decrement it for every request

That creates a critical-path dependency that is:

- high latency
- high blast radius
- hard to scale
- vulnerable to partitions

Global quotas are a design exercise in **hierarchical budget allocation**, not a reason to serialize every request across the planet.

## First principle

For large systems, the request path should usually spend from a **local lease**, not from the absolute global truth.

That means a quota system is layered:

```text
global configured quota
  -> regional budget
    -> instance-local lease
      -> per-request spend
```

The request path becomes local and cheap.

The trade-off is bounded overshoot.

## What is the actual guarantee?

Be explicit.

Possible guarantees:

### Hard quota

Never exceed the global cap.

This is very expensive operationally and often incompatible with a low-latency multi-region path.

### Soft quota with bounded overshoot

May exceed quota by at most the sum of outstanding leases plus reconciliation delay.

This is the practical production target.

### Fair-share quota

Global capacity is shared according to demand and priority, not just a fixed cap.

This is often what internal platforms really need.

## Recommended architecture

Split into:

1. **quota control plane**
2. **global allocator**
3. **regional quota stores**
4. **local lease caches in gateways/services**

```text
policy store
  -> allocator
      -> regional assignments
          -> regional state store
              -> node-local leases
                  -> request path
```

### Control plane

Stores:

- quota definitions
- subject dimensions
- priority
- burst reserve policy
- fail-open / fail-closed behavior

### Allocator

Periodically decides how much budget each region may spend.

### Regional store

Tracks currently available regional budget and issues leases to local nodes.

### Node-local lease cache

Consumes requests from already leased tokens without remote dependency per call.

## Global quota object

A quota usually needs:

```json
{
  "quota_id": "tenant-123-api-read",
  "scope": "tenant:123",
  "unit": "request",
  "global_limit_per_minute": 5000000,
  "burst_reserve": 500000,
  "priority": "standard",
  "allocation_policy": "demand_weighted",
  "fail_mode": "closed"
}
```

There may also be multiple nested quotas:

- per-tenant global
- per-product global
- per-endpoint global

Those should not all be enforced with strong cross-key atomicity in the request path unless the product absolutely requires it.

## Allocation loop

The allocator runs every interval, such as every 500 ms or every few seconds.

Inputs:

- configured global limit
- current regional demand
- outstanding leases by region
- region health
- backlog / queueing / rejection rates

Outputs:

- new regional available budget
- optional reserve transfers

## Allocation strategies

### Static weighted split

```text
regional_budget[r] = global_quota * weight[r]
```

Simple and stable, but wastes capacity when traffic distribution is uneven.

### Demand-weighted split

```text
regional_budget[r] = global_quota * smoothed_demand[r] / sum(smoothed_demand)
```

Higher efficiency, but can oscillate if the demand signal is noisy.

Use smoothing:

```text
smoothed_demand = alpha * recent + (1 - alpha) * previous
```

### Base plus reserve

Give every region:

- a baseline allocation
- access to a shared reserve pool

This is a strong default when you want both predictability and elasticity.

## Regional leasing

Inside each region, the quota store issues leases to local nodes.

Example:

```text
regional budget = 50,000 tokens
node A lease = 2,000
node B lease = 2,000
...
```

Nodes spend locally and only contact the regional store when renewing or acquiring more lease.

Benefits:

- lower request-path latency
- much lower regional state-store QPS
- resilience to short control-plane hiccups

Trade-off:

- overshoot bound grows with lease size and number of active nodes

## Overshoot math

If each of `N` nodes can hold up to `L` outstanding tokens, then node-local overshoot is bounded roughly by:

```text
N * L
```

Add regional allocator lag and in-flight requests, and total overshoot becomes:

```text
regional_outstanding_leases
+ allocator_interval_drift
+ in_flight_unreported_usage
```

This is the right engineering conversation.

Do not claim exactness if the system is explicitly using leases.

## Lease sizing

Large leases:

- lower coordination overhead
- increase overshoot
- slow fair redistribution

Small leases:

- improve accuracy
- increase regional store QPS
- cause more renewal chatter

A practical strategy is adaptive lease sizing:

- small for low-volume or near-limit subjects
- larger for steady high-throughput subjects

## Near-depletion behavior

As a quota approaches exhaustion, the system should tighten control:

- issue smaller leases
- increase refresh frequency
- maybe disable opportunistic burst reserve

This reduces end-of-window overshoot and improves the quality of the final decisions.

## Burst reserve

Many systems want:

- steady base allocation
- temporary bursts for hot regions

Use a reserve pool:

```text
global_limit = base_allocations + reserve_pool
```

Regions request reserve only when local demand exceeds base.

Reserve grants should have:

- expiry
- priority ordering
- fairness policy

Otherwise the busiest region can starve everyone else.

## Failure modes

### Allocator unavailable

Regions continue spending existing assigned budget until it expires.

### Regional store unavailable

Nodes spend existing local lease; new lease issuance pauses.

### One region partitioned

That region may continue on stale budget until local leases expire. This is why local budgets must be bounded and expiring.

### Region death

Allocator should reclaim its unused future budget and redistribute elsewhere.

This is why allocator state must distinguish:

- assigned
- leased
- spent
- expired / reclaimable

## Reconciliation

You need a slower reconciliation path to compare:

- expected spend
- lease issuance
- observed decision logs
- regional reports

This catches:

- accounting drift
- buggy clients
- allocator bugs
- nodes that overspent stale lease

Request-path performance and accounting accuracy usually live on different time horizons, so they deserve different pipelines.

## Hard vs soft deny

When quota is nearly exhausted, decisions can become policy-aware:

- premium traffic gets remaining reserve
- background or low-priority work is cut first
- regional fairness caps apply

This turns quota from a blunt binary tool into an actual capacity management system.

## Relationship to rate limiting

A rate limiter is a mechanism for local enforcement.

A global quota system is the policy and allocation layer above that mechanism.

The usual combination is:

1. quota allocator decides budgets
2. regional limiter enforces assigned regional budget
3. local nodes spend from leases

That is why global quotas belong in the same learning path as rate limiting but are not the same design.

## Relationship to distributed locking

You do not usually need a global lock for every spend.

But you may need coordination for:

- allocator leadership
- ownership of quota shard processing
- mutually exclusive policy mutation workflows

That is where a lock or leadership primitive may appear, but it should stay off the request path.

## Observability

Track:

- configured quota
- assigned regional budget
- outstanding regional leases
- outstanding node leases
- estimated overshoot bound
- denied requests by quota and region
- reserve utilization
- reallocation frequency

Operators should be able to answer:

- which region is exhausting quota
- whether the issue is real spend or lease fragmentation
- how much overshoot risk currently exists

## Common mistakes

### 1. globally serialized request-path spend

This creates a fragile worldwide dependency.

### 2. no explicit overshoot model

Then the design silently violates its own contract.

### 3. huge leases near quota exhaustion

This causes ugly end-of-window bursts.

### 4. static regional split for highly dynamic traffic

This wastes capacity and causes false denial.

### 5. no reconciliation loop

Then you trust approximate issuance forever with no correction path.

## What the senior answer sounds like

> I would not enforce a worldwide quota by decrementing one global counter in the request path. Instead, I would use hierarchical budgets: a global allocator periodically assigns regional budgets based on configured quota, demand, and health; each region issues expiring leases to local nodes; and the request path spends from those local leases. That keeps request latency regional and scalable while giving an explicit bounded-overshoot model. Lease size should shrink near quota exhaustion, and I would maintain a slower reconciliation pipeline to compare assigned, leased, and spent usage. The key trade-off is correctness versus latency: I would choose bounded eventual correctness for most high-throughput APIs and reserve globally serialized hard quotas only for domains where that cost is truly justified.

## Key takeaways

- Global quotas are usually a **hierarchical allocation problem**, not a global counter problem.
- Keep the request path local by spending from **regional and node-local leases**.
- Be explicit about **bounded overshoot**; that is the real correctness contract.
- Use smoothing, reserve pools, and adaptive lease sizing to balance efficiency and fairness.
- Separate **fast-path allocation** from **slow-path reconciliation and accounting**.
