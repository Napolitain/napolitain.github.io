---
title: "Count-Min Sketch"
description: "Estimate item frequencies in a stream with a tiny counter matrix, a few hash functions, and a guaranteed one-sided error."
date: 2026-03-07
tags: ["sketch", "streaming", "frequency", "rare"]
draft: false
visualization: "CountMinSketchVisualization"
family: "probabilistic"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["hash-map"]
related: ["bloom-cuckoo-filters", "hyperloglog", "cache-eviction-strategies"]
enables: []
---

## Problem

An exact frequency table stores one counter per distinct key. That is perfect when the key space is modest, but it breaks down for huge streams, telemetry firehoses, or caches trying to remember millions of short-lived candidates.

Sometimes you do not need exact counts. You need a tiny structure that can answer:

> is this item probably frequent enough to care about?

## Intuition

A Count-Min Sketch is a grid of counters with `d` rows and `w` columns.

Each row has its own hash function. When an item arrives, you increment one counter per row. To query a key, you hash it into the same `d` positions and take the **minimum** of those counters.

Why the minimum?

Because collisions only add extra mass. They can push a counter upward, but they can never subtract from the true count. The minimum is the least polluted estimate among the rows.

## Core operations

### Update

```
update(x, delta = 1):
    for r in 1 .. d:
        c <- h_r(x) mod w
        table[r][c] <- table[r][c] + delta
```

### Query

```
estimate(x):
    ans <- +infinity
    for r in 1 .. d:
        c <- h_r(x) mod w
        ans <- min(ans, table[r][c])
    return ans
```

### Merge

If two sketches use the same dimensions and hash functions, they merge by pointwise addition.

```
merge(A, B):
    for r in 1 .. d:
        for c in 1 .. w:
            A[r][c] <- A[r][c] + B[r][c]
```

That mergeability is one reason sketches are so useful in distributed systems.

## Worked example

Suppose `d = 3`, `w = 8`, and the stream is:

`login, search, login, view, login, search`

After processing the stream, the three rows may contain different collisions, but every row position touched by `login` has been incremented three times.

If one of those cells also got bumped by unrelated collisions, its value might be 4 or 5. The query takes the minimum over the three candidate cells, so it still returns something close to the true frequency.

That is the pattern to remember:

- collisions add noise
- noise is one-sided
- minimum counters reduce the damage

## Error bounds and parameter choice

For total stream weight `N`, a Count-Min Sketch can be sized so that:

- estimated count is never below the true count
- overestimation is at most `epsilon * N` with probability at least `1 - delta`

A standard choice is:

- `w = ceil(e / epsilon)`
- `d = ceil(ln(1 / delta))`

So:

- bigger `w` reduces collision error
- bigger `d` reduces the probability that every row is badly polluted

## Complexity

| Operation | Time | Space |
|---|---|---|
| Update | `O(d)` | `O(d * w)` |
| Query | `O(d)` | `O(d * w)` |
| Merge | `O(d * w)` | `O(d * w)` |

The memory depends only on the sketch dimensions, not on the number of distinct keys observed.

## When to choose Count-Min Sketch

| Structure | Answers | Error shape | Best for |
|---|---|---|---|
| Hash map | Exact frequency | None | Small or moderate key spaces |
| Count-Min Sketch | Approximate frequency | Overestimates only | Huge streams, hot-key detection, admission heuristics |
| Bloom filter | Approximate membership | False positives only | "Seen or not seen?" checks |
| HyperLogLog | Approximate distinct count | Cardinality error | "How many unique keys?" questions |

## Key takeaways

- Count-Min Sketch estimates **frequency**, not membership and not cardinality.
- The estimate is biased upward because collisions can only add counts, never remove them.
- The minimum across rows is the core trick that makes the sketch useful.
- `w` controls the size of collision error; `d` controls the probability of a bad estimate.
- TinyLFU-style cache admission is a perfect example of why an approximate counter can still drive a real algorithm well.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Count-Min Sketch overview](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) | Hard | Multiple hashed counter rows with one-sided error |
| [Mining of Massive Datasets notes](https://www.mmds.org/) | Hard | Frequency sketches and streaming heavy hitters |
| [TinyLFU paper](https://arxiv.org/abs/1512.00727) | Hard | Frequency estimation inside cache admission |

## Relation to other topics

- **Bloom Filter & Cuckoo Filter** answer approximate membership instead of approximate frequency.
- **HyperLogLog** estimates distinct count instead of per-item count.
- **Cache Eviction Strategies** use sketch-style counts in TinyLFU-like admission logic.
