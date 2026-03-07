---
title: "Sparse Table"
description: "Answer static range minima, maxima, or gcd queries in O(1) after O(n log n) preprocessing. Sparse tables are pure precomputation power."
date: 2026-03-07
tags: ["sparse-table", "range-query", "idempotent", "rare"]
draft: false
visualization: "SparseTableVisualization"
family: "range-query"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["prefix-sum"]
related: ["prefix-sum", "segment-tree", "fenwick-tree", "binary-lifting", "lowest-common-ancestor"]
enables: []
---

## Problem

You have a fixed array and need to answer lots of range queries like:

- minimum on $[L, R]$
- maximum on $[L, R]$
- gcd on $[L, R]$

There are **no updates**. Since the array never changes, you should spend preprocessing time to make queries almost free.

## Intuition

Precompute answers for every range whose length is a power of two:

- length 1
- length 2
- length 4
- length 8
- ...

Let `st[k][i]` store the answer for the interval starting at `i` with length $2^k$.

Then a large query can be answered with just two overlapping power-of-two blocks.

## Build

```
st[0][i] <- arr[i]

for k in 1..LOG:
    for i in 0..n - 2^k:
        st[k][i] <- merge(st[k-1][i], st[k-1][i + 2^(k-1)])
```

For range minimum query, `merge` is just `min`.

## Query for RMQ

For a query $[L, R]$:

- let `len = R - L + 1`
- let `k = floor(log2(len))`
- answer with

$$
\min(st[k][L], st[k][R - 2^k + 1])
$$

Those two blocks cover the whole interval. They may overlap, but that is okay because `min`, `max`, and `gcd` are **idempotent**.

## The idempotent restriction

Sparse tables are amazing only when overlap is harmless.

Good operations:

- min
- max
- gcd
- bitwise and/or

Bad operations:

- sum
- xor counts
- anything where double-counting changes the answer

If overlap breaks the merge, you need a segment tree, Fenwick tree, or another structure instead.

## Why it feels like binary lifting

Sparse tables and binary lifting share the same core idea:

> precompute answers for jumps of size $2^k$

Sparse tables jump over **interval lengths**. Binary lifting jumps over **ancestors**. Same doubling pattern, different domain.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Build | $O(n \log n)$ | $O(n \log n)$ |
| Query | $O(1)$ | $O(n \log n)$ |

## Key takeaways

- Sparse tables are unbeatable for **static idempotent range queries**
- The structure is just doubling: every level merges two blocks from the previous level
- Two overlapping power-of-two blocks are enough for RMQ in $O(1)$
- Do not use a sparse table if the operation cannot tolerate overlap
- Binary lifting is the tree analogue of the same precompute-by-powers-of-two idea

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Minimum Absolute Difference Queries](https://leetcode.com/problems/minimum-absolute-difference-queries/) | 🔴 Hard | Static range information, often with heavy preprocessing |
| [K-th Ancestor of a Tree Node](https://leetcode.com/problems/kth-ancestor-of-a-tree-node/) | 🟡 Medium | Same doubling idea as sparse tables, but on ancestors |
| [Static RMQ](https://judge.yosupo.jp/problem/staticrmq) | 🟡 Medium | Range minimum query benchmark |

## Relation to other topics

- **Fenwick tree** is dynamic but only naturally handles prefix-like merges
- **Segment tree** handles updates and general merges, but queries stay $O(\log n)$
- **Binary lifting** uses the same doubling table idea on rooted trees rather than arrays
