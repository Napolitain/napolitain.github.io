---
title: "Circuit Breakers (State Machines, Hysteresis, and Fast Failure)"
description: "Design circuit breakers that actually stabilize a fleet: rolling windows, half-open probes, dependency-scoped state, and clean interaction with retries and load shedding."
date: 2026-04-27
tags: ["circuit-breaker", "timeouts", "half-open", "hysteresis", "resilience", "dependency-isolation"]
draft: false
family: "reliability"
kind: "building-block"
difficulty: "advanced"
prerequisites: ["idempotency-and-retries"]
related: ["designing-a-rate-limiter", "load-shedding"]
enables: ["load-shedding"]
---

## Problem

When a dependency starts failing, naive clients do the worst possible thing:

1. keep sending traffic
2. wait too long for timeouts
3. retry aggressively
4. saturate their own worker pool
5. amplify the outage

A circuit breaker exists to **fail fast once the dependency is already known bad**.

The goal is not decorative resilience. The goal is to stop one unhealthy dependency from converting into:

- thread pool exhaustion
- queue growth
- event-loop lag
- retry storms
- system-wide cascading failure

## State machine

The canonical breaker has three states:

```text
CLOSED -> OPEN -> HALF_OPEN -> CLOSED
```

### CLOSED

Traffic flows normally and outcomes are observed.

### OPEN

Requests are rejected immediately or sent to fallback.

### HALF_OPEN

A small number of probe requests are allowed through to test recovery.

This is the right abstraction, but the implementation details decide whether the breaker stabilizes the system or flaps uselessly.

## The breaker key

Never use one giant global breaker.

Breakers should usually be scoped by:

- caller service
- callee dependency
- operation / endpoint
- sometimes region or tenant class

Example:

```text
payments-api -> fraud-service -> POST /score
```

Why this matters:

- failures are often endpoint-specific
- one degraded method should not blackhole all traffic
- blast radius should match the actual fault domain

## Tripping logic

The worst implementation is:

```text
if 5 failures in a row => open
```

This is too brittle. It ignores traffic volume, latency, and error ratios.

### Better signal: rolling statistical window

Track over a recent horizon:

- total requests
- failures
- timeouts
- latency percentiles
- local saturation signals

Then trip on a minimum-volume threshold plus ratio/latency policy.

Example:

```text
window = 10s rolling
minimum volume = 100 requests
open if:
  failure_ratio > 50%
  OR timeout_ratio > 30%
  OR p99_latency > 2s for sustained interval
```

The minimum-volume guard prevents one or two unlucky failures from opening rarely used endpoints.

## Hysteresis

Breakers need **different thresholds for opening and closing**.

Without hysteresis:

- dependency partially recovers
- breaker closes too early
- traffic floods back
- dependency fails again
- breaker reopens

That oscillation is itself a failure mode.

A practical rule:

- open on strong evidence of failure
- close only after probe success plus a cooldown

This is the same reason control systems avoid using one threshold for both directions.

## Half-open behavior

Half-open is where many weak designs go wrong.

Bad version:

> after 10 seconds, let all traffic through again

That is not a probe. That is a surge.

Use a small controlled budget:

```text
allow N concurrent probes or M requests/s in HALF_OPEN
```

If enough probes succeed:

- transition to CLOSED

If probes fail:

- transition back to OPEN

This keeps recovery testing cheap and prevents synchronized re-flooding.

## Interaction with timeouts

A breaker without strict timeouts is incomplete.

Requests must have:

- connection timeout
- request timeout
- total deadline

If timeouts are too long, the breaker trips too late because the caller is already holding scarce resources for too long.

If timeouts are too short, the breaker learns fake failure from an otherwise healthy but variable dependency.

The timeout should reflect:

- normal latency distribution
- queueing model
- user-facing deadline
- cost of retry

## Interaction with retries

Correct layering:

1. apply short timeout
2. consult breaker
3. if CLOSED, execute
4. if retryable failure, maybe retry within budget
5. update breaker metrics from outcomes

The breaker should gate retries too.

Once OPEN:

- new first attempts should fail fast
- retries should fail fast

Otherwise the retry layer bypasses the protection.

## Fallbacks

Open does not have to mean "return 500."

Possible fallbacks:

- stale cache
- partial response
- downgraded feature mode
- asynchronous acceptance instead of synchronous completion

Examples:

- recommendation service breaker opens -> serve cached recommendations
- feature flag dependency opens -> use last-known config snapshot
- avatar service opens -> return default avatar URL

But be careful: bad fallbacks can hide real outages too well and delay detection.

## Distributed vs local breaker state

Use **local process breaker state** for the hot path.

Why local?

- it is cheap
- it reacts to the caller's actual experience
- it avoids putting another dependency in front of every call

Do not centralize breaker state unless there is a strong reason. Centralized breaker systems are often slower, less accurate, and create shared failure modes.

What can be centralized:

- breaker configuration
- thresholds
- feature gates
- telemetry aggregation

What should remain local:

- rolling windows
- current open/closed decision
- half-open probe accounting

## Latency-aware breaking

Error rate alone is not enough.

A dependency can still return `200` while becoming operationally toxic due to latency.

Example:

- success rate stays 98%
- p99 latency jumps from 40 ms to 4 s
- caller thread pool exhausts anyway

That is why many systems trip on:

- failure ratio
- timeout ratio
- or extreme tail latency

Some systems even use saturation signals like queueing delay or outstanding concurrency as a trip input.

## Example local data structure

```text
state
opened_at
cooldown_until
rolling_success_count
rolling_failure_count
rolling_timeout_count
rolling_latency_histogram
half_open_probe_limit
half_open_inflight
```

The rolling window can be implemented with:

- fixed time buckets
- exponentially decayed counters
- ring buffers per second

Fixed buckets are usually simple and good enough.

## Pseudocode

```text
allow_request():
  if state == OPEN and now < cooldown_until:
    return REJECT_FAST

  if state == OPEN and now >= cooldown_until:
    state = HALF_OPEN

  if state == HALF_OPEN:
    if half_open_inflight >= probe_limit:
      return REJECT_FAST
    half_open_inflight += 1
    return ALLOW_PROBE

  return ALLOW_NORMAL

record_outcome(result):
  update rolling metrics

  if state == CLOSED and should_open(metrics):
    state = OPEN
    cooldown_until = now + open_interval

  else if state == HALF_OPEN:
    half_open_inflight -= 1
    if should_reopen(result, metrics):
      state = OPEN
      cooldown_until = now + open_interval
    else if enough_probe_success(metrics):
      state = CLOSED
```

## Preventing modal collapse in large fleets

In a large fleet, thousands of processes can make the same breaker decision at once.

Use jitter in:

- open cooldown duration
- half-open probe timing

Otherwise all instances probe simultaneously and recreate a thundering herd at recovery time.

## Interaction with load shedding

Circuit breakers protect against unhealthy dependencies.

Load shedding protects against local saturation.

These should cooperate:

- dependency breaker opens -> fewer doomed calls consume resources
- local load shedding activates -> low-priority requests never reach expensive dependency path

This is the combination that keeps a service alive under partial failure plus overload.

## Operational metrics

Track:

- opens per dependency
- time spent open
- half-open success ratio
- fast-fail count
- fallback count
- latency before and after breaker activation

If breakers are always open, the dependency is down.

If breakers flap constantly, the thresholds are wrong or the dependency is oscillating.

If breakers never open during known incidents, they are probably too conservative.

## Common mistakes

### 1. one breaker for an entire dependency

This causes unnecessary blast radius.

### 2. opening on tiny sample sizes

That creates noisy false positives.

### 3. no half-open limit

Recovery turns into a surge.

### 4. ignoring latency and only counting HTTP 500s

You miss the dependency that is "technically up" but operationally unusable.

### 5. retries outside the breaker

This nullifies the protection.

## What the senior answer sounds like

> I would implement circuit breakers as local per-dependency, per-operation state machines with rolling-window metrics, minimum-volume guards, and hysteresis. The breaker should open on sustained failure, timeout, or extreme latency rather than a few consecutive bad calls. In OPEN it should fail fast, and in HALF_OPEN it should allow only a small probe budget with jitter so recovery does not trigger a herd. Breakers must compose with timeouts, retries, and load shedding: short deadlines feed the breaker accurate signals, retries are bounded and blocked once the breaker is open, and local overload controls stop low-value work before it consumes scarce resources. Configuration can be centralized, but the decision itself should stay local to avoid another critical-path dependency.

## Key takeaways

- A circuit breaker is a **state machine plus statistical decision rule**, not an if-statement on recent failures.
- Use **rolling windows, minimum volume, hysteresis, and limited half-open probes**.
- Scope breakers to the real fault domain: dependency plus operation, not the whole world.
- Pair breakers with **timeouts, retries, and load shedding** or they will not stabilize the system.
- Keep breaker decisions local; centralize config and telemetry, not the hot-path state.
