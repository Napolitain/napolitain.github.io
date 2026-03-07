---
title: "HyperLogLog"
description: "Estimate the number of distinct items in a huge stream with tiny registers and the statistics of rare hash patterns."
date: 2026-03-07
tags: ["cardinality", "streaming", "probabilistic", "rare"]
draft: false
visualization: "HyperLogLogVisualization"
family: "probabilistic"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["hash-map"]
related: ["count-min-sketch", "bloom-cuckoo-filters"]
enables: []
---

## Problem

Exact distinct counting means storing every unique key seen so far. That is often far too expensive for telemetry, analytics, and large distributed systems.

The question becomes:

> can I estimate cardinality without storing the full set?

HyperLogLog is the standard answer.

## Intuition

Hash every item so the bit patterns look random. Rare patterns become evidence about how many unique items must have been seen.

If a hash suffix begins with many leading zeros, that event is unlikely. Seeing such a rare event suggests the stream is large.

HyperLogLog spreads this logic across many registers:

1. use the first `b` hash bits to choose one of `m = 2^b` registers
2. use the remaining bits to measure `rho`, the index of the first `1` bit
3. store the maximum `rho` ever observed in that register

Large cardinality produces larger register maxima.

## Core operations

### Update

```
update(x):
    h <- hash64(x)
    j <- first b bits of h          // register index, 0 <= j < m
    w <- remaining bits of h        // suffix
    r <- rho(w)                     // number of leading zeros in w, plus 1
    M[j] <- max(M[j], r)
```

`rho(w)` is the core statistic. If `w = 000101...`, then `rho(w) = 4` because the first `1` appears after three leading zeros.

### Estimate

HyperLogLog combines the register values with a harmonic-mean style formula:

```
estimate():
    Z <- sum over j of 2^(-M[j])
    E <- alpha_m * m^2 / Z

    if E is small and many registers are still zero:
        return m * ln(m / V)        // linear counting correction

    return bias-corrected E
```

Where:

- `V` is the number of zero registers
- `alpha_m` is a constant depending on `m`
- real implementations apply bias correction tables as well

You do not need to memorize the constant to understand the structure. The key idea is that **larger register maxima push the estimate upward**.

### Merge

Two HyperLogLogs with the same register layout merge by taking the register-wise maximum.

```
merge(A, B):
    for j in 0 .. m-1:
        A[j] <- max(A[j], B[j])
```

That makes HyperLogLog extremely attractive for distributed analytics.

## Worked example

Suppose `b = 4`, so there are `m = 16` registers.

A hashed item might look like:

`1011 | 000100101...`

- register index `j = 1011` -> register 11
- suffix starts with three zeros, then a `1`
- so `rho = 4`
- update `M[11] = max(M[11], 4)`

After many inserts, each register stores evidence about how rare the strongest pattern in that bucket has been. HyperLogLog aggregates those signals instead of storing the keys themselves.

## Accuracy and parameter choice

HyperLogLog's relative error is roughly:

$$
\frac{1.04}{\sqrt{m}}
$$

So more registers mean better accuracy.

Examples:

- `m = 1024` -> about 3.25% relative error
- `m = 16384` -> about 0.8% relative error

The memory cost grows with `m`, not with the number of distinct keys.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Update | `O(1)` | `O(m)` registers |
| Estimate | `O(m)` | `O(m)` |
| Merge | `O(m)` | `O(m)` |

## When to choose HyperLogLog

| Structure | Answers | Typical memory story | Best for |
|---|---|---|---|
| Hash set | Exact cardinality | One entry per distinct key | Exact distinct counting |
| Bloom filter | Membership | Bit array | "Probably present?" questions |
| Count-Min Sketch | Frequency | Counter matrix | Heavy-hitter and admission logic |
| HyperLogLog | Distinct count | Fixed register array | Unique users, unique sessions, unique keys |

## Key takeaways

- HyperLogLog estimates **cardinality**, not membership and not per-item frequency.
- The structure works because long runs of leading zeros in random hashes are rare and therefore informative.
- The update rule is tiny: choose a register, compute `rho`, keep the maximum.
- Merge is just register-wise `max`, which is why HyperLogLog scales so well across machines.
- The accuracy knob is the number of registers `m`: more registers cost more memory but reduce relative error.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [HyperLogLog overview](https://en.wikipedia.org/wiki/HyperLogLog) | Hard | Register maxima from rare hash patterns |
| [HyperLogLog in Practice](https://research.google/pubs/hyperloglog-in-practice-algorithmic-engineering-of-a-state-of-the-art-cardinality-estimation-algorithm/) | Hard | Bias correction and practical engineering details |
| [Redis HyperLogLog docs](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/) | Hard | Real-world cardinality estimation API |

## Relation to other topics

- **Bloom Filter & Cuckoo Filter** approximate membership.
- **Count-Min Sketch** approximates per-item frequency.
- HyperLogLog fills the third major sketch niche: approximate distinct counting.
