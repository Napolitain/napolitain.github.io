---
title: "Difference Array"
description: "Apply many range updates in O(1) each, then rebuild the final values with one prefix pass. Difference arrays are the update-side twin of prefix sums."
date: 2026-03-07
tags: ["difference-array", "range-update", "prefix-sum", "array"]
draft: false
visualization: "DifferenceArrayVisualization"
family: "range-query"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["prefix-sum"]
related: ["prefix-sum", "fenwick-tree", "segment-tree"]
enables: ["fenwick-tree", "segment-tree"]
---

## Problem

You need to apply many updates like:

- add `x` to every element in `[L, R]`
- process a whole batch of range increments efficiently

Doing each update one cell at a time costs $O(n)$ per query. That is too slow when there are many updates.

## Core idea

Instead of editing the whole range, only mark its boundaries:

- add `delta` at `L`
- subtract `delta` at `R + 1`

Later, run a prefix sum over these markers to recover the real values.

## Update rule

```
diff[L] <- diff[L] + delta
if R + 1 < n:
    diff[R + 1] <- diff[R + 1] - delta
```

That means one range update touches only two positions.

## Rebuild rule

```
running <- 0
for i in 0..n-1:
    running <- running + diff[i]
    a[i] <- base[i] + running
```

The prefix sum is what turns the boundary markers back into actual values.

## Why it matters

Difference arrays are the cleanest way to learn that:

- prefix sums answer static range queries
- difference arrays apply static range updates

They are mirror images.

From there, it is much easier to understand why Fenwick trees and segment trees are useful: they bring the same ideas into dynamic settings.

## Complexity

| Operation | Time |
|---|---|
| One range update | $O(1)$ |
| Rebuild final array | $O(n)$ |

## When to use it

Use a difference array when:

- all updates are known ahead of time
- you do not need to answer queries between updates
- the operation is additive and can be accumulated with a prefix pass

If updates and queries are interleaved online, move to Fenwick trees or segment trees.

## Key takeaways

- Difference arrays make range updates constant time
- They only work because a later prefix sum reconstructs the full values
- Prefix sum and difference array belong together conceptually
- This is one of the most useful “not fancy, but essential” techniques in the whole atlas

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Range Addition](https://leetcode.com/problems/range-addition/) | �� Medium | Classic difference-array batch update problem |
| [Corporate Flight Bookings](https://leetcode.com/problems/corporate-flight-bookings/) | 🟡 Medium | Mark route changes at interval boundaries |
| [Car Pooling](https://leetcode.com/problems/car-pooling/) | 🟡 Medium | Difference array over passenger count changes |

## Relation to other topics

- **Prefix sum** rebuilds the final values from difference markers
- **Fenwick tree** is the dynamic upgrade path for prefix-style updates/queries
- **Segment tree** handles more general online range update/query combinations
