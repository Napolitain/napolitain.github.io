---
title: "Prefix Sum"
description: "Precompute cumulative totals so any range sum becomes one subtraction. Prefix sums are the first serious range-query idea everyone should know."
date: 2026-03-07
tags: ["prefix-sum", "range-query", "precomputation", "array"]
draft: false
visualization: "PrefixSumVisualization"
family: "range-query"
kind: "technique"
difficulty: "intro"
prerequisites: []
related: ["difference-array", "fenwick-tree", "segment-tree", "sparse-table", "mos-algorithm"]
enables: ["difference-array", "fenwick-tree", "segment-tree", "sparse-table", "mos-algorithm"]
---

## Problem

You need many range-sum queries on a fixed array:

- sum from `L` to `R`
- count values inside a range
- answer subarray aggregates quickly after one preprocessing pass

Doing each query directly costs $O(n)$. If there are many queries, that is wasteful.

## Core idea

Build a cumulative array:

$$
prefix[i] = a[0] + a[1] + \dots + a[i - 1]
$$

with `prefix[0] = 0`.

Then any range sum becomes:

$$
\text{sum}(L, R) = prefix[R + 1] - prefix[L]
$$

That is the whole trick.

## Why it matters

Prefix sum is one of the most important “simple but permanent” techniques in DSA.

It shows up before and inside more advanced structures:

- **Difference arrays** are basically prefix sums run in reverse
- **Fenwick trees** maintain prefix-style information dynamically
- **Segment trees** generalize the same range-query goal when updates matter
- **Sparse tables** are another static precomputation path for different operations

## Build

```
prefix[0] <- 0
for i in 0..n-1:
    prefix[i + 1] <- prefix[i] + a[i]
```

## Query

```
range_sum(L, R):
    return prefix[R + 1] - prefix[L]
```

## Complexity

| Operation | Time | Space |
|---|---|---|
| Build | $O(n)$ | $O(n)$ |
| One range sum | $O(1)$ | - |

## Common uses

- subarray sums
- counting values after converting a predicate into `0/1`
- 2D range sums on matrices
- detecting balanced segments after remapping symbols to numbers

## Key takeaways

- Prefix sums trade one linear preprocessing pass for constant-time range queries
- They are the cleanest first step into the range-query family
- Many “advanced” structures are really dynamic or generalized versions of this same idea
- If the array never changes and the operation is additive, prefix sum is often the right answer immediately

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) | 🟢 Easy | Pure prefix-sum preprocessing |
| [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | 🟡 Medium | Prefix sums plus hashing |
| [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | 🟡 Medium | Prefix/suffix accumulation pattern |

## Relation to other topics

- **Difference array** is the update-side counterpart of prefix sums
- **Fenwick tree** keeps prefix-style queries fast when values change
- **Segment tree** is heavier but supports richer range queries and updates
