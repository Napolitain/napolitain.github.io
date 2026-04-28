---
title: "Token Bucket, GCRA, and Virtual Time"
description: "Understand token-based rate limiting mathematically: saturated integrators, debt-space duals, and why token bucket and GCRA are the same policy in different coordinates."
date: 2026-04-27
tags: ["token-bucket", "gcra", "virtual-time", "rate-limiting", "integrator", "traffic-shaping"]
draft: false
family: "traffic-management"
kind: "foundation"
difficulty: "advanced"
prerequisites: []
related: ["designing-a-rate-limiter", "global-quotas", "load-shedding"]
enables: ["designing-a-rate-limiter"]
---

## Problem

Most system design answers treat token bucket as folklore:

> refill tokens, spend tokens, reject when empty

That is operationally useful but mathematically shallow.

The deeper view is that token bucket is a **state-space model for admission control**. Once you see that, a lot of "separate" systems ideas collapse into the same object:

- burst budget
- queue debt
- virtual scheduling
- global quota leasing

This page gives the exact model, the dual interpretation, and the equivalence to **GCRA**.

## State equation

Let:

- \(b(t)\) = tokens currently in the bucket
- \(B\) = maximum bucket capacity
- \(r\) = refill rate in tokens per second
- \(u(t)\) = consumption rate induced by arriving traffic

Then the continuous-time dynamics are:

$$
\frac{db}{dt} = r - u(t)
$$

with saturation:

$$
0 \le b(t) \le B
$$

That means the exact system is:

$$
\frac{db}{dt} = \Pi_{[0,B]}(r - u(t))
$$

if you write the saturating dynamics compactly, or more practically:

$$
b(t^+) = \min(B,\; b(t^-) + r \Delta t) - \text{cost}
$$

whenever an event arrives.

Discrete-time form:

$$
b_{k+1} = \operatorname{clip}_{[0,B]}\left(b_k + r \Delta t - c_k\right)
$$

where \(c_k\) is the token cost consumed during interval \(k\).

## Why this is an integrator

An integrator accumulates the difference between input and output.

Here the bucket integrates:

$$
\int (r - u(t))\,dt
$$

So the bucket is literally accumulating unused budget.

Interpretation:

- if demand stays below refill, credit builds up
- if demand exceeds refill, credit is depleted
- the stored state \(b(t)\) is reusable burst capacity

That is why token bucket is the right mental model for "average rate plus burst."

## Is token bucket a leaky integrator?

**Not exactly in the classical control-theory sense.**

A classical leaky integrator is:

$$
\frac{dx}{dt} = -\lambda x + ku(t)
$$

where the leak term is proportional to the state.

Token bucket instead is:

$$
\frac{db}{dt} = r - u(t)
$$

with hard clipping.

So the precise statement is:

- token bucket is a **saturated integrator**
- not a classical exponential leaky integrator

But there is an important dual form where it looks like a leaky system in **debt space** rather than **credit space**.

## Credit space vs debt space

Define deficit:

$$
d(t) = B - b(t)
$$

Then:

$$
\frac{dd}{dt} = u(t) - r
$$

subject to:

$$
0 \le d(t) \le B
$$

Now the state no longer means "available credit." It means "accumulated debt."

This duality is the real systems insight:

- **token space** stores permission
- **deficit space** stores owed service time

They are the same policy represented in different coordinates.

## Why engineers confuse token bucket with leaky bucket

Because the two systems are duals:

- token bucket says "you may spend stored credit"
- leaky-bucket-style backlog says "you have accumulated so much debt that future arrivals must wait or be rejected"

In one representation you track **surplus**.
In the other you track **deficit**.

For policing and conformance, these often generate the same allow/deny decisions.

## Burst size

The burst parameter is not decorative. It is the state bound.

If the bucket capacity is \(B\), then the system can admit up to \(B\) tokens of work immediately after a long idle period.

That means:

- \(r\) controls long-run throughput
- \(B\) controls short-term burst tolerance

This is mathematically clean because the integrated excess budget is bounded:

$$
\int_{\text{idle}} (r - u(t))\,dt \le B
$$

That is the entire burst story in one inequality.

## Weighted requests

Token systems get much more interesting when cost is not 1.

Let request \(i\) consume \(c_i\) tokens. Then the conformance condition is:

$$
b(t_i^-) \ge c_i
$$

and the update is:

$$
b(t_i^+) = b(t_i^-) - c_i
$$

This is why token buckets show up in real production systems:

- cheap read = 1 token
- write = 5 tokens
- expensive fanout = 20 tokens

You now have one generic mechanism for cost-aware admission control.

## Event-driven implementation

You do not simulate the ODE every millisecond.

Instead, on each arrival at time \(t_i\):

1. compute elapsed time \(\Delta t = t_i - t_{i-1}\)
2. refill by \(r \Delta t\)
3. cap at \(B\)
4. test whether enough tokens exist
5. subtract cost if accepted

Pseudocode:

```text
tokens = min(B, tokens + r * (now - last))
last = now

if tokens >= cost:
    tokens -= cost
    allow
else:
    deny
```

The event-driven form and the continuous model are the same system.

## GCRA: the virtual-time form

GCRA, the **Generic Cell Rate Algorithm**, stores virtual schedule debt instead of token credit.

It keeps a single variable:

- `TAT` = theoretical arrival time

For unit-cost arrivals:

- \(T = 1/r\) is the ideal inter-arrival period
- \(\tau\) is the tolerance for burst

Conformance rule:

$$
a_n \ge TAT_{n-1} - \tau
$$

Update rule:

$$
TAT_n = \max(a_n,\; TAT_{n-1}) + T
$$

Interpretation:

- `TAT` is the virtual time at which the next perfectly scheduled request should arrive
- if the real arrival is too early relative to that schedule, it violates the policy

## Why GCRA and token bucket are equivalent

Token bucket stores **available credit**.
GCRA stores **virtual debt**.

The mapping is:

- more tokens <=> smaller schedule debt
- fewer tokens <=> larger schedule debt

You can formalize that with a transformed state:

$$
\delta_n = TAT_n - a_n
$$

which behaves like accumulated debt in time units.

Then accepted arrivals update debt exactly the way token bucket updates missing credit.

The burst parameter maps to a scheduling tolerance:

$$
\tau \approx B \cdot T
$$

depending on the exact bucket convention. Some texts use \((B-1)T\) instead. That off-by-one is a convention issue, not a different algorithm.

So:

- token bucket = reservoir of credit
- GCRA = deadline schedule with tolerated advance

Same policy. Different state variable.

## Why virtual time is useful

GCRA has advantages when you want:

- compact per-key state
- precise schedule semantics
- telecom-style policing
- easier reasoning about early arrivals

Token bucket has advantages when you want:

- obvious burst semantics
- weighted token costs
- intuitive budgeting language

Large systems often describe the same control both ways depending on whether the audience is:

- networking-heavy
- application-heavy
- scheduler-heavy

## Queueing interpretation

If you reinterpret deficit as backlog, the token bucket becomes a queueing picture:

$$
\frac{dq}{dt} = u(t) - r
$$

with rejection once backlog-equivalent debt exceeds a bound.

That is why token buckets connect so naturally to:

- pacing
- shaping
- queue drain models
- global budget leasing

All of them are variations of "integrate the mismatch between arrival and service."

## Production implications

### 1. Token systems are local state machines

They turn a rate contract into one bounded scalar state per key.

### 2. Weighted cost is first-class

This is how "requests per second" becomes "resource cost budget per second."

### 3. Hierarchical composition is easy

You can stack:

- user bucket
- tenant bucket
- region bucket
- global leased bucket

### 4. Virtual-time forms are often better for rigorous conformance reasoning

This matters in telecom, schedulers, and precise policing.

## Common mistakes

### 1. Saying token bucket and leaky integrator are identical

The exact statement is "saturated integrator, with a debt-space dual that looks like a leaky backlog model."

### 2. Ignoring cost weighting

Then the limiter treats cheap and expensive work as equivalent.

### 3. Treating burst size as arbitrary

It is the bounded integrated surplus state.

### 4. Thinking GCRA is a different family of limiter

It is really the same conformance policy written in virtual-time coordinates.

## What the senior answer sounds like

> I model token bucket as a saturated integrator: the bucket state accumulates the difference between refill rate and traffic cost over time, clipped between zero and the burst bound. That makes burst tolerance mathematically explicit because the stored state is integrated unused budget. If I switch coordinates from available credit to accumulated debt, I get the dual queueing view, which is why people often describe equivalent policies as leaky buckets. GCRA is the same control in virtual time: instead of storing tokens, it stores a theoretical next-allowed-arrival schedule. In production terms, token bucket, debt-space backlog, and GCRA are all ways of representing one bounded admission-control state machine.

## Key takeaways

- Token bucket is a **saturated integrator**.
- The right dual variable is **debt / deficit**, not just "empty bucket."
- **Burst** is the bound on integrated unused budget.
- **GCRA** is the same policy expressed in **virtual-time coordinates**.
- This math is why token systems compose so well into rate limiters, quotas, and hierarchical budget controllers.
