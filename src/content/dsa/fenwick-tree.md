---
title: "Fenwick Tree (Binary Indexed Tree)"
description: "Maintain prefix sums with O(log n) updates and queries using one tiny bit trick. Fenwick trees are the lightest dynamic range-query structure worth knowing."
date: 2026-03-07
tags: ["fenwick-tree", "range-query", "prefix-sum", "rare"]
draft: false
visualization: "FenwickTreeVisualization"
family: "range-query"
kind: "data-structure"
difficulty: "intermediate"
prerequisites: ["prefix-sum"]
related: ["prefix-sum", "difference-array", "segment-tree", "sparse-table", "euler-tour-technique"]
enables: ["euler-tour-technique", "binary-lifting"]
---

## Problem

You need to support two operations on an array:

- point updates
- prefix or range sum queries

Prefix sums give $O(1)$ queries but $O(n)$ updates. A segment tree gives $O(\log n)$ for both, but is heavier than necessary if all you need is prefix-style aggregation.

A Fenwick tree gives you the same asymptotic speed with a much smaller constant factor.

## Intuition

The structure is just an array, but each `bit[i]` stores the sum of a chunk ending at `i`.

The chunk size is determined by the least significant set bit:

$$
\text{lowbit}(i) = i \& (-i)
$$

So `bit[12]` stores the sum of the last 4 elements ending at 12, because `lowbit(12) = 4`.

The magic is that these chunks partition any prefix into a handful of disjoint ranges.

## Query

To compute `prefixSum(i)`, keep jumping backward:

```
prefix_sum(i):
    ans <- 0
    while i > 0:
        ans <- ans + bit[i]
        i <- i - lowbit(i)
    return ans
```

Each step removes one chunk from the end of the prefix.

## Update

To add `delta` at index `i`, update every Fenwick cell whose chunk includes that index:

```
add(i, delta):
    while i <= n:
        bit[i] <- bit[i] + delta
        i <- i + lowbit(i)
```

Query walks **downward** by stripping bits. Update walks **upward** by adding them back.

## Range sums

Fenwick trees are naturally prefix-based, so range sums come from subtraction:

$$
\text{sum}(L, R) = \text{prefix}(R) - \text{prefix}(L - 1)
$$

That means two prefix queries are enough for any range sum.

## Why it works

Binary carries are doing the work for you.

- `i - lowbit(i)` removes the last active block from a prefix
- `i + lowbit(i)` moves to the next larger block that also covers index `i`

The structure is really about navigating those binary boundaries efficiently.

## Fenwick vs segment tree vs sparse table

| Structure | Updates | Range query | Best for |
|---|---|---|---|
| Prefix sum | $O(n)$ | $O(1)$ | Static sums |
| Fenwick tree | $O(\log n)$ | $O(\log n)$ | Dynamic prefix/range sums |
| Segment tree | $O(\log n)$ | $O(\log n)$ | Richer merges and lazy propagation |
| Sparse table | none | $O(1)$ | Static idempotent queries |

Fenwick is the middle ground: much simpler than a segment tree, much more dynamic than a sparse table.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Add | $O(\log n)$ | $O(n)$ |
| Prefix sum | $O(\log n)$ | $O(n)$ |
| Range sum | $O(\log n)$ | $O(n)$ |
| Build by repeated adds | $O(n \log n)$ | $O(n)$ |

## Key takeaways

- `lowbit(i)` is the whole structure: it tells you both the chunk size and where to jump next
- Fenwick trees shine when you need **dynamic sums** but do **not** need the full generality of a segment tree
- Prefix and range queries are really the same problem; range sums are just two prefixes subtracted
- The implementation is compact enough that it is worth memorizing directly
- Euler tours often pair with Fenwick trees to turn subtree updates into array range operations

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Range Sum Query - Mutable](https://leetcode.com/problems/range-sum-query-mutable/) | 🟡 Medium | Classic Fenwick or segment tree problem |
| [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | 🔴 Hard | Coordinate compression plus Fenwick frequencies |
| [Queries on a Permutation With Key](https://leetcode.com/problems/queries-on-a-permutation-with-key/) | 🟡 Medium | Dynamic positions tracked with a BIT |
| [Create Sorted Array through Instructions](https://leetcode.com/problems/create-sorted-array-through-instructions/) | 🔴 Hard | Prefix counts inside a compressed value domain |

## Relation to other topics

- **Segment tree** is heavier but more flexible; Fenwick is the minimal dynamic range-sum structure
- **Sparse table** handles static range minima/maxima in $O(1)$, but cannot support updates
- **Euler tour technique** turns tree subtrees into contiguous intervals that a Fenwick tree can query
