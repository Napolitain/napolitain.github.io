---
title: "Feature Flags Control Plane (Versioning, Distribution, and Safe Rollouts)"
description: "Design a feature flag platform that supports low-latency local evaluation, strong auditability, deterministic targeting, and safe configuration rollouts across a fleet."
date: 2026-04-27
tags: ["feature-flags", "control-plane", "rollouts", "xds", "targeting", "configuration"]
draft: false
family: "control-plane"
kind: "end-to-end-design"
difficulty: "advanced"
prerequisites: []
related: ["designing-a-rate-limiter", "distributed-locking", "global-quotas"]
enables: ["global-quotas"]
---

## Problem

At small scale, a feature flag is a boolean in a database.

At large scale, a feature flag platform becomes a **control plane**:

- thousands of flags
- millions of evaluations per second
- deterministic rollout semantics
- low-latency local decision making
- auditable changes
- instant kill switches

If the platform is badly designed, the "safe rollout" mechanism becomes one of the most dangerous systems in the company.

## First principle

A feature flag system is not primarily a UI problem.

It is a distributed configuration system with two planes:

1. **control plane**: author, validate, version, distribute
2. **data plane**: evaluate locally on the request path

That separation is the main design move.

Do not put the configuration database on the hot path of request evaluation.

## Goals

The platform should support:

- boolean and multivariate flags
- percentage rollouts
- targeting by tenant, user, region, app version, capability
- instant kill switches
- monotonic rollout progression
- full audit history
- local evaluation in microseconds to low milliseconds
- eventual recovery if a push update is missed

## Non-goals

Do not promise:

- globally synchronous config updates on every host at the exact same instant
- unbounded rule complexity with no effect on evaluation cost
- unlimited ad hoc predicates in the request path

Production flag systems work because the request-path evaluator is constrained and compiled.

## High-level architecture

```text
operator UI / automation API
  -> config authoring service
      -> validation / compilation service
          -> durable config store
          -> distribution stream

SDK / gateway / service process
  <- push update stream
  <- periodic snapshot polling
  -> local in-memory evaluator
```

Key idea:

- authoring and storage can be slower and richer
- evaluation must be local, tiny, and deterministic

## Data model

A flag definition usually needs:

```json
{
  "flag_key": "checkout-new-tax-engine",
  "version": 17,
  "type": "boolean",
  "default_variant": "off",
  "rules": [
    {
      "priority": 10,
      "match": {
        "tenant_tier": ["enterprise"],
        "region": ["us-east1", "us-west1"]
      },
      "variant": "on"
    },
    {
      "priority": 20,
      "rollout": {
        "attribute": "tenant_id",
        "percentage": 5
      },
      "variant": "on"
    }
  ],
  "owner": "checkout-platform",
  "created_by": "alice",
  "created_at": "...",
  "change_reason": "progressive rollout after load test"
}
```

Important properties:

- stable `flag_key`
- monotonic `version`
- explicit default
- deterministic ordering
- audit metadata

## Deterministic rollout

Percentage rollout must be sticky.

Bad version:

```text
if rand() < 0.05 then on
```

This flips the user experience on every evaluation.

Correct version:

```text
bucket = H(flag_key || subject_id) % 10000
enabled if bucket < percentage * 100
```

That gives:

- deterministic assignment
- monotonic expansion from 5% to 10%
- no per-request randomness

Pick the subject carefully:

- `user_id` if user experience should stay sticky
- `tenant_id` if rollout should be tenant-wide
- `session_id` only when session-level variance is acceptable

## Local evaluation

Evaluation should happen from a local in-memory snapshot.

A typical per-request flow:

1. extract evaluation context
2. lookup compiled flag object by key
3. execute ordered match rules
4. if rollout rule applies, compute deterministic hash bucket
5. return variant

There should be no:

- database round trip
- remote RPC to flag service
- dynamic code execution

The evaluator should be predictable enough that teams are comfortable using flags on latency-sensitive paths.

## Compilation step

Do not ship raw user-authored JSON directly into the hot path.

Compile into:

- normalized rule trees
- canonical match predicates
- validated type-safe attributes
- precomputed priority order
- efficient rollout hashing metadata

Compilation is where you reject:

- invalid attributes
- impossible comparisons
- overlapping rules with unexpected shadowing
- illegal rollout configurations

This is how the control plane prevents operators from shipping pathological logic to every host.

## Distribution model

Use **push plus periodic pull**.

### Push

Good for:

- fast propagation
- kill switches
- low steady-state staleness

Examples:

- streaming gRPC
- xDS-like configuration
- Kafka / PubSub fanout through a config delivery layer

### Periodic pull / snapshot revalidation

Good for:

- recovering missed updates
- simplifying late join
- verifying local cache integrity

A robust platform uses both.

## Versioning and monotonicity

Every host should know:

- current snapshot version
- last applied change
- last successful sync time

Requests and logs should record:

```text
flag_key
flag_version
variant
match_reason
```

Without version visibility, debugging a rollout is guesswork.

## Staged rollout model

A safe rollout system supports these phases:

1. **shadow evaluation**: compute but do not act
2. **internal users / test tenants**
3. **small percentage rollout**
4. **regional / tenant expansion**
5. **global enable**

Shadow mode is especially important for flags that change:

- data writes
- billing behavior
- routing
- authorization

You want proof that the targeting logic matches reality before turning on the effect.

## Kill switch design

Some flags exist mainly for emergency disable.

Requirements for kill switches:

- highest distribution priority
- tiny evaluation cost
- clear ownership
- tested regularly

If the system can only disable a broken feature after waiting 10 minutes for polling, it is not an operational kill switch.

## Multi-region behavior

Most control planes are eventually consistent across regions.

That is acceptable if you are explicit:

- normal propagation target: e.g. seconds
- emergency propagation target: e.g. sub-second to a few seconds
- stale snapshot tolerance: bounded and monitored

If a flag changes routing, auth, quota, or safety behavior, you may need stronger guarantees such as ordered regional rollouts or explicit operator control over region activation.

## Failure modes

### Control plane unavailable

Data plane should keep serving from last-known-good snapshot.

### Push channel broken

Polling should repair state.

### Bad config published

Need version rollback, change freeze, and kill switch path.

### Partial fleet on old version

Need per-host version telemetry so rollout health is visible immediately.

## Schema validation and policy linting

Strong systems reject dangerous config before distribution.

Useful validators:

- attribute existence and type checking
- duplicate priority detection
- dead rule detection
- rollout subject sanity
- flag dependency cycle detection

Example anti-pattern:

```text
if region == "us-east1" then on
if tenant_tier == "enterprise" then off
```

If ordering is unclear, operators will reason incorrectly about the result.

## Flag dependencies

Avoid deep flag dependency chains on the request path.

Bad:

```text
flag A depends on flag B depends on flag C depends on experiment D
```

That creates:

- evaluation complexity
- hidden precedence
- operator confusion

If dependencies are necessary, compile them into an acyclic resolved form and enforce depth limits.

## Observability

Track:

- flag evaluation count by key and variant
- snapshot versions by host
- push propagation lag
- polling freshness lag
- config rejection count
- rollout distribution skew

For sensitive flags, sampled evaluation logs are useful:

```json
{
  "flag_key": "checkout-new-tax-engine",
  "version": 17,
  "subject": "tenant_123",
  "variant": "on",
  "reason": "percentage_rollout(bucket=311)"
}
```

Do not log raw PII. Use stable identifiers or hashes.

## Common mistakes

### 1. remote evaluation on the request path

This turns the flag service into a dependency for every request.

### 2. non-sticky percentage rollout

That causes flicker and invalid experiments.

### 3. no audit trail

Then incident review devolves into screenshots and memory.

### 4. too much rule expressiveness

An unrestricted DSL often becomes impossible to reason about or evaluate cheaply.

### 5. no rollback discipline

If rollback is manual and slow, operators stop trusting the platform.

## What the senior answer sounds like

> I would design feature flags as a control plane plus local evaluation data plane. Operators write versioned configurations through an authoring API, the config is validated and compiled into a restricted efficient representation, and then distributed to services through push plus periodic snapshot polling. Request-path evaluation must be local, deterministic, and sticky for percentage rollout using a stable hash of flag key and subject. The system needs first-class audit metadata, rollout stages, kill switches, and per-host version telemetry, because the real production problems are bad config, partial propagation, and unclear precedence rather than just boolean lookup.

## Key takeaways

- A serious flag system is a **distributed configuration platform**, not a database table.
- Keep **remote storage out of the hot path**; evaluate from local compiled snapshots.
- Percentage rollout must be **deterministic and sticky**.
- Use **push plus pull**, version every snapshot, and log applied versions.
- Auditability, rollback, and validation are part of the design, not extras.
