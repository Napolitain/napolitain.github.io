---
title: "Feedback Control for Autoscaling and Load Shedding"
description: "Use PI/PID ideas the way production systems actually do: filtered signals, clamped actions, weak predictive bias, and layered controllers instead of textbook loops."
date: 2026-04-27
tags: ["feedback-control", "pid", "pi", "autoscaling", "load-shedding", "ewma"]
draft: false
family: "reliability"
kind: "building-block"
difficulty: "advanced"
prerequisites: ["designing-a-rate-limiter"]
related: ["circuit-breakers", "load-shedding", "global-quotas", "anti-windup-hysteresis-and-oscillation"]
enables: ["anti-windup-hysteresis-and-oscillation", "load-shedding"]
---

## Problem

A distributed system is full of control loops whether you call them that or not:

- autoscalers try to hold latency or CPU near a target
- admission controllers try to hold concurrency below a safe bound
- regional allocators rebalance quota in response to demand
- background schedulers pace work so queues do not explode

The attractive but naive answer is:

> use PID

The production answer is:

> use a **PI-like controller wrapped in filtering, saturation, hysteresis, and rate limits**, because software systems are delayed, noisy, and full of competing controllers

That is the difference between knowing the acronym and actually being able to ship a stable system.

## Canonical loop

At time step \(k\):

- \(x_k\) = raw measurement
- \(y_k\) = filtered measurement
- \(r_k\) = target / setpoint
- \(e_k = r_k - y_k\) = error
- \(u_k\) = control action

The simplest useful loop is:

$$
y_k = \alpha x_k + (1-\alpha)y_{k-1}
$$

$$
I_k = I_{k-1} + e_k \Delta t
$$

$$
u_k^* = K_p e_k + K_i I_k
$$

$$
u_k = \operatorname{clamp\_rate\_limit}(u_k^*)
$$

This is already much closer to production than naked textbook PID.

## Why the derivative term is often weak or absent

Textbook PID adds:

$$
K_d \frac{e_k - e_{k-1}}{\Delta t}
$$

The derivative term is attractive because it reacts to trend. In software systems, it is also dangerous because measurements are noisy:

- CPU is quantized and bursty
- p99 latency is jagged
- queue depth changes in bursts
- request volume can jump between batches

So many real controllers are:

- **PI**, not full PID
- or **PID-like** with a tiny derivative contribution on already filtered signals

The broad pattern at hyperscale is "derivative is too noisy unless heavily filtered."

## Measurement smoothing vs actuation damping

This distinction is where many otherwise smart systems go unstable.

### Measurement smoothing

You smooth what you **observe**:

$$
y_k = \alpha x_k + (1-\alpha)y_{k-1}
$$

This is an EWMA. It reduces noise in the sensed state.

### Actuation damping

You smooth what you **do**:

$$
u_k = u_{k-1} + \beta (u_k^* - u_{k-1})
$$

This rate-limits how fast the action moves.

These are different layers:

- filtering stabilizes the sensor
- damping stabilizes the actuator

Mixing them mentally leads to controllers that are either jittery or sluggish for the wrong reasons.

## Predictive scaling, but weakly

Pure forecasting looks elegant:

$$
u_k = f(\text{forecast}_{k+1:k+h})
$$

It is also fragile under:

- bursty workloads
- event-driven spikes
- adversarial traffic
- rapid mode changes

The more robust design is:

$$
u_k^* = K_p e_k + K_i I_k + \varepsilon \cdot \text{trend}_k
$$

where \(\varepsilon\) is intentionally small.

That means:

- mostly reactive
- slightly predictive

This is how real autoscalers and regional budget controllers stay useful without trusting forecasts too much.

## Saturation is part of the plant

Distributed systems do not have unconstrained actuators.

Examples:

- replica count cannot go below 0
- concurrency cap cannot jump from 10 to 10,000 instantly
- quota redistribution cannot exceed available reserve
- deployment rate is bounded by safety policy

So any real controller needs:

$$
u_k \in [u_{\min}, u_{\max}]
$$

and often:

$$
|u_k - u_{k-1}| \le \Delta_{\max}
$$

That rate limit is not cosmetic. It is a core stability mechanism.

## Control delays dominate software systems

A controller is only as good as the loop delay allows.

In software, delays come from:

- scrape interval
- metrics pipeline lag
- moving-average window
- scheduler reconciliation period
- pod startup time
- cache warmup
- network propagation

That means the system is often acting on a measurement of the past while the effect of the last action has not fully materialized yet.

This is why aggressive gains are dangerous.

## Autoscaling example

Suppose:

- target CPU = 60%
- measured CPU = 85%
- filtered CPU = 78%

Then:

$$
e_k = 0.60 - 0.78 = -0.18
$$

If negative error means "need more capacity", then the proportional term says scale up.

But you still should not jump instantly to the proportional recommendation because:

- current pods may not yet be fully loaded
- pending pods may already be starting
- traffic may already be falling

So the action is:

1. filtered
2. clamped
3. rate-limited
4. re-evaluated in the next control interval

That is control engineering translated into production behavior.

## Load shedding example

For load shedding, the controlled variable may be:

- in-flight concurrency
- queue depth
- p99 latency
- event-loop lag

The controller target is not "maximize throughput." It is usually:

> keep latency or concurrency below the knee of the curve

Action space might be:

- reject low-priority traffic
- reduce heavy-request concurrency
- enter brownout mode
- tighten local limits

So the control law might be:

$$
u_k^* = K_p \cdot (\text{target latency} - \text{filtered latency}) + K_i \cdot \text{latency integral}
$$

then map \(u_k\) to a shed probability, concurrency cap, or brownout stage.

## Why large systems are hierarchical, not monolithic

One giant PID loop for the whole fleet is the wrong shape.

The practical architecture is layered:

### Fast inner loop

- per-process concurrency limit
- event-loop lag shedding
- immediate queue protection

### Medium loop

- service autoscaling
- workload placement
- traffic shifting

### Slow outer loop

- regional quota allocation
- predictive reservations
- capacity planning adjustments

Each layer has:

- different latency
- different observability quality
- different actuator limits

This is how "Google-style" or Borg-like systems are best understood: **systems of controllers controlling other controllers**, not one neat equation.

## Hysteresis and deadbands

If the metric sits near a threshold, a controller with zero deadband will chatter.

A deadband says:

$$
|e_k| < \epsilon \Rightarrow \text{do nothing}
$$

That suppresses pointless micro-adjustments.

This is especially useful for:

- replica count changes
- brownout mode entry/exit
- global quota rebalance

## Anti-windup is mandatory

Once the actuator saturates, the integral term can keep growing:

$$
I_k = I_{k-1} + e_k \Delta t
$$

even though the controller no longer has authority to apply that extra correction.

That creates overshoot once the actuator comes out of saturation.

Real systems solve this with:

- clamped integrals
- conditional integration
- back-calculation

This is not an advanced edge case. It is table stakes for controllers with bounded actuation.

## What production loops usually look like

The actual control block usually looks like:

1. sample raw metrics
2. EWMA / percentile smoothing
3. compute error from target
4. combine proportional and integral terms
5. add tiny predictive bias
6. clamp and rate-limit action
7. apply hysteresis / deadband
8. detect instability and adjust gains

That pipeline is more realistic than teaching PID as three isolated letters.

## Common mistakes

### 1. No filtering

Then the controller reacts to noise.

### 2. No rate limit on actuation

Then one spike causes a giant corrective jump.

### 3. Pure forecasting

Then rare or adversarial traffic breaks the controller.

### 4. One loop controlling a variable with huge unmodeled delay

Then the gain that seems fine in theory becomes unstable in production.

### 5. Ignoring that other controllers exist

Autoscaler, queue shedder, circuit breaker, and client retry logic can all interact.

## What the senior answer sounds like

> In distributed systems I would not deploy a textbook PID loop directly. I would start with a PI-style controller on filtered signals, then add actuator saturation, rate limits, deadbands, and anti-windup because software control loops are delayed and noisy. Predictive signals can help, but only as a weak bias on top of mostly reactive control because workload forecasts are brittle under bursts and mode shifts. I would also keep the control architecture hierarchical: fast local loops protect concurrency and latency, medium loops handle autoscaling, and slower outer loops handle quota placement or regional balancing. The real engineering work is not picking PID. It is building a controller that stays stable under delay, noise, and competing loops.

## Key takeaways

- Production controllers are usually **PI-like, filtered, clamped, and hierarchical**.
- **Measurement smoothing** and **actuation damping** are different mechanisms.
- Predictive scaling should usually be a **small bias**, not the whole policy.
- Delay and actuator saturation are first-class parts of the model.
- The best mental model is not one controller. It is **layered feedback loops**.
