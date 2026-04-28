---
title: "Load Shedding (Protecting Latency Under Saturation)"
description: "Design admission control that drops the right work at the right time, using concurrency, queue depth, cost, and priority instead of letting the service fail slowly."
date: 2026-04-27
tags: ["load-shedding", "admission-control", "concurrency", "brownout", "overload", "latency"]
draft: false
family: "traffic-management"
kind: "end-to-end-design"
difficulty: "advanced"
prerequisites: ["circuit-breakers"]
related: ["designing-a-rate-limiter", "feedback-control-for-autoscaling-and-load-shedding", "anti-windup-hysteresis-and-oscillation", "global-quotas", "idempotency-and-retries"]
enables: []
---

## Problem

Rate limiting answers:

> how much traffic should this caller be allowed to send?

Load shedding answers:

> how much work can *this service* safely admit right now?

Those are different questions.

A service can melt down even when every caller is obeying its contract:

- one dependency gets slower
- queue depth rises
- concurrency climbs
- tail latency explodes
- callers retry
- the service spends all capacity on work it can no longer finish on time

If you wait until outright failure, you are already late. The job of load shedding is to **protect useful latency by rejecting work before the system enters a death spiral**.

## First principle

Overload is not binary. It is a control problem.

The real control surface is usually one of:

- in-flight concurrency
- queue length
- estimated request cost
- local resource saturation

The most robust limiter is rarely "requests per second". It is usually **concurrency plus priority-aware admission**.

## What to shed

Not all work has equal value.

Useful classes:

1. **critical interactive**
2. **standard interactive**
3. **best-effort**
4. **background**

Examples:

- `POST /checkout` is more valuable than `GET /recommended-products`
- cache refresh is less valuable than user-visible read
- analytics fanout is less valuable than the write path

This means load shedding should operate on:

- priority
- cost
- deadline

not just raw arrival count.

## Architecture

There are usually two shedding layers:

1. **edge / gateway shedding**
2. **service-local shedding**

### Gateway shedding

Protects downstream systems early.

Good for:

- coarse tenant or route prioritization
- global incident response
- rejecting obviously low-value traffic before it enters the mesh

### Service-local shedding

Uses local truth:

- worker pool occupancy
- event-loop lag
- CPU pressure
- internal queue depth
- dependency health

This is where the best decisions are made because local saturation is what actually kills the service.

## Admission signals

### In-flight concurrency

Often the best primary signal.

Why:

- directly represents outstanding work
- correlates with memory and thread consumption
- easy to cap

A service with bounded concurrency is far easier to stabilize than one that accepts unbounded in-flight work.

### Queue depth

Useful, but queueing is already an overload symptom.

If the queue is growing, latency is already being traded for eventual rejection.

Queues should usually be:

- shallow
- bounded
- priority-aware

### CPU and memory

Helpful but lagging.

By the time CPU is pinned, tail latency may already be gone.

### Event-loop lag / request latency

Very useful in async runtimes.

If event-loop delay or scheduler delay rises, the service is already struggling to make progress.

## Recommended design

For most online services:

1. cap **concurrent in-flight requests**
2. keep **small bounded queues**
3. apply **priority tiers**
4. use **estimated request cost**
5. shed before the queue becomes large

This protects p99 latency better than one giant FIFO queue.

## Request cost

Some requests are much heavier than others.

Examples:

- `GET profile` -> cheap
- `POST export-report` -> expensive
- search with large fanout -> expensive
- write with multiple downstream calls -> expensive

Represent cost as a small integer or weight:

```text
light = 1
medium = 5
heavy = 20
```

Then consume from a concurrency budget proportionally:

```text
admit if inflight_cost + request_cost <= max_cost_budget
```

This is far better than counting a trivial cache hit and a giant export job as one identical unit.

## Priority-aware admission

At overload time:

1. reserve guaranteed capacity for critical classes
2. shrink or eliminate best-effort classes
3. disable optional features

Example:

```text
critical: 50 concurrency units reserved
interactive: 100 shared units
background: 20 units, first to be cut
```

This is the same philosophy as QoS in networking: when the system is stressed, protect the work that matters most.

## Brownout mode

Sometimes the best load shedding is not total rejection.

Instead:

- remove recommendations
- skip expensive fanout
- downgrade image processing
- return partial data
- disable secondary enrichment

This is **brownout**: reduce optional work so the core request stays healthy.

A staff-level answer should mention this because many real systems survive incidents by degrading features, not just dropping requests.

## Queueing discipline

Avoid large FIFO queues in latency-sensitive services.

Large queues:

- hide overload
- increase tail latency
- waste work on requests that will already miss client deadlines

Better choices:

- small bounded FIFO
- priority queues
- deadline-aware admission
- "drop oldest stale work first" for background tasks

If a request has a client deadline of 200 ms and has already waited 180 ms, admitting it into deep internal work may be pointless.

## Concurrency limiter algorithm

The simplest useful model:

```text
max_inflight_cost = configurable budget
```

Admission:

```text
if inflight_cost + request_cost > max_inflight_cost:
    reject
else:
    inflight_cost += request_cost
    execute
    inflight_cost -= request_cost when done
```

This is static and easy to reason about.

More advanced systems adapt the limit based on observed latency.

## Latency-adaptive concurrency

Static limits are safe but leave efficiency on the table.

An adaptive limiter can:

1. observe latency as concurrency changes
2. raise the limit when latency remains healthy
3. lower the limit when queueing or latency rises

Conceptually:

```text
if latency < target and no drops:
    increase limit slowly
if latency > target or queueing grows:
    decrease limit aggressively
```

This is closer to TCP congestion control than fixed thresholding.

The important principle is asymmetry:

- probe upward carefully
- cut downward fast

## Interaction with rate limiting

Rate limits control *who* may consume capacity.

Load shedding controls *whether the service currently has capacity at all*.

A request can pass rate limiting and still be shed because the service is saturated.

That is correct behavior.

Common pipeline:

1. rate limit at gateway
2. route request
3. local load-shed decision
4. call dependencies guarded by circuit breakers

## Interaction with retries

Rejected requests are often retried by callers.

That means the rejection contract matters:

- use meaningful status codes
- expose retry hints only when safe
- avoid telling everyone to retry immediately

Examples:

- `429` when the caller-specific contract is the main limiter
- `503` when service-local overload is the problem

If a request is dropped due to hard local saturation, giving a tiny `Retry-After` to every caller can recreate the herd later.

## Interaction with idempotency

For expensive writes, clients may retry after load-shed responses.

That is why:

- write operations should be idempotent
- overload responses should be explicit
- background work should not begin until admission is granted

Without idempotency, overload plus retries becomes data corruption risk.

## Multi-stage shedding

A practical design has stages:

### Stage 0: normal

All priority classes enabled.

### Stage 1: soft pressure

- cut background traffic
- disable low-value enrichments
- tighten concurrency caps for heavy requests

### Stage 2: hard pressure

- admit only critical and standard interactive
- queue limits drop sharply
- expensive endpoints require available reserve

### Stage 3: survival mode

- admit only critical paths
- all optional work off
- maybe serve stale or partial responses

This staged model is much more controllable than a single threshold.

## Example decision function

```text
if request.priority == background and pressure >= SOFT:
    reject

if request.cost == heavy and available_budget < heavy_reserve:
    reject

if inflight_cost + request.cost > max_budget:
    reject

if queue_depth > queue_limit_for(request.priority):
    reject

allow
```

## Observability

Track:

- admitted vs shed by route
- shed by priority class
- current concurrency budget
- queue depth distribution
- brownout feature activations
- latency before and after shedding
- retry volume after shed responses

If you cannot answer which class is being dropped and why, you cannot operate the system during an incident.

## Common mistakes

### 1. deep queues instead of early rejection

This preserves throughput briefly while destroying latency.

### 2. dropping work with no notion of priority

Then critical traffic suffers alongside low-value traffic.

### 3. static thresholds with no incident modes

You need staged controls and brownout options.

### 4. shedding only at the gateway

Local services know much more about their own real saturation.

### 5. using CPU alone as the primary signal

CPU is usually a lagging symptom, not the best admission indicator.

## What the senior answer sounds like

> I would treat load shedding as a local admission-control problem rather than a caller fairness problem. The core control signal would be weighted in-flight concurrency with small bounded queues, because that maps better to tail latency than raw requests per second. Requests would carry priority and estimated cost, so under pressure the service can cut background work first, disable optional features in brownout mode, and preserve capacity for critical interactive paths. I would keep rate limiting and load shedding separate: rate limits protect shared capacity across callers, while load shedding protects the service from its own current saturation. The design needs meaningful overload responses, retry-aware behavior, and strong metrics so operators can see which classes are being sacrificed to preserve latency.

## Key takeaways

- Load shedding is about **protecting local latency under saturation**, not caller fairness.
- **Weighted concurrency plus priority** is a stronger control surface than raw QPS.
- Prefer **small bounded queues and early rejection** over deep buffering.
- Brownout and staged degradation are often better than binary "up/down" behavior.
- Coordinate load shedding with **rate limiting, retries, circuit breakers, and idempotency**.
