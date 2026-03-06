---
title: "Segment Tree"
description: "Answer range queries and point updates in O(log n). Segment trees are the go-to structure for range sum, range min, and similar problems."
date: 2026-03-06
tags: ["segment-tree", "tree", "range-query", "divide-and-conquer"]
draft: false
visualization: "SegmentTreeVisualization"
---

## Problem

You have an array of $n$ elements. You need to:
- **Query** an aggregate (sum, min, max) over any subarray $[L, R]$
- **Update** individual elements

A naive approach gives $O(1)$ update and $O(n)$ query, or $O(n)$ update and $O(1)$ query with prefix sums. A segment tree gives $O(\log n)$ for both.

## Intuition

Divide the array into segments recursively. Each node in the tree stores the aggregate for its segment. The root covers $[0, n-1]$, its children cover $[0, \text{mid}]$ and $[\text{mid}+1, n-1]$, and so on down to individual elements at the leaves. Any range $[L, R]$ can be decomposed into $O(\log n)$ disjoint segments already stored in the tree.

## Build

Construct bottom-up. Leaves hold the original array values. Each internal node merges its two children.

```
build(node, start, end, arr):
    if start == end:
        tree[node] ← arr[start]
        return
    mid ← (start + end) / 2
    build(2*node, start, mid, arr)
    build(2*node+1, mid+1, end, arr)
    tree[node] ← tree[2*node] + tree[2*node+1]
```

$O(n)$ time — each of the $2n - 1$ nodes is visited once.

## Query

To query $[L, R]$: at each node covering $[\text{start}, \text{end}]$, either the segment is fully inside $[L, R]$ (return it), fully outside (return identity), or partially overlapping (recurse into both children and combine).

```
query(node, start, end, L, R):
    if R < start or end < L:       // no overlap
        return 0
    if L <= start and end <= R:     // total overlap
        return tree[node]
    mid ← (start + end) / 2        // partial overlap
    return query(2*node, start, mid, L, R)
         + query(2*node+1, mid+1, end, L, R)
```

At most $O(\log n)$ nodes are visited — two per level of the tree.

## Update

To update index $i$: walk from the root to the leaf, then propagate the new aggregate back up.

```
update(node, start, end, i, val):
    if start == end:
        tree[node] ← val
        return
    mid ← (start + end) / 2
    if i <= mid:
        update(2*node, start, mid, i, val)
    else:
        update(2*node+1, mid+1, end, i, val)
    tree[node] ← tree[2*node] + tree[2*node+1]
```

One root-to-leaf path → $O(\log n)$.

## Lazy propagation

When you need **range updates** (add $v$ to every element in $[L, R]$), visiting every leaf is $O(n)$. Lazy propagation defers updates: mark a node as "pending" and only push the update down to children when they're actually queried. This keeps both range update and range query at $O(\log n)$. The tradeoff is implementation complexity — you maintain a separate `lazy[]` array and flush pending updates before any node access.

## Array representation

A segment tree on $n$ elements is stored in a flat array of size $4n$. Node $i$ has:
- Left child: $2i$
- Right child: $2i + 1$
- Parent: $\lfloor i / 2 \rfloor$

The root is at index 1 (index 0 is unused). This is the same trick as a binary heap but with 1-based indexing.

## Common patterns

| Pattern | Merge operation | Identity |
|---|---|---|
| Range sum | $a + b$ | $0$ |
| Range min | $\min(a, b)$ | $+\infty$ |
| Range max | $\max(a, b)$ | $-\infty$ |
| Range GCD | $\gcd(a, b)$ | $0$ |
| Count in range | $a + b$ (with predicate at leaves) | $0$ |

Any associative operation works. The merge function defines what your tree computes.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Build | $O(n)$ | $O(4n)$ |
| Point query | $O(\log n)$ | — |
| Range query | $O(\log n)$ | — |
| Point update | $O(\log n)$ | — |
| Range update (lazy) | $O(\log n)$ | $O(4n)$ extra |

## Key takeaways

- **Any associative operation works** as the merge function — sum, min, max, GCD, bitwise OR. Define the merge and identity, and the tree handles the rest.
- **$O(\log n)$ for both query and update** is the sweet spot between prefix sums ($O(1)$ query, $O(n)$ update) and naive arrays ($O(n)$ query, $O(1)$ update).
- **Lazy propagation is essential for range updates** — without it, updating a range of elements is $O(n)$. With it, both range update and query stay $O(\log n)$.
- **Flat array of size $4n$ with 1-based indexing** — node $i$ has children $2i$ and $2i+1$. No pointers, no overhead, cache-friendly.
- **Segment trees dominate** when you need both updates and queries — if the array is static, prefer a sparse table or prefix sums.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Range Sum Query - Mutable](https://leetcode.com/problems/range-sum-query-mutable/) | 🟡 Medium | Direct segment tree application for sum queries with point updates |
| [My Calendar I](https://leetcode.com/problems/my-calendar-i/) | 🟡 Medium | Segment tree or balanced BST to detect overlapping intervals |
| [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | 🔴 Hard | Segment tree on value space, processing array right to left |
| [The Skyline Problem](https://leetcode.com/problems/the-skyline-problem/) | 🔴 Hard | Sweep line with segment tree or priority queue for active heights |
| [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/) | 🔴 Hard | Segment tree on prefix sums to count valid ranges |

## Relation to other topics

**Fenwick tree (BIT)**: simpler to implement, less memory, but only supports prefix queries natively. You can do range queries with two prefix queries, but operations like range min don't work. If all you need is range sum with point updates, a Fenwick tree is lighter.

**Sparse table**: $O(1)$ range min/max queries after $O(n \log n)$ preprocessing, but the array must be **static** — no updates allowed.

**Sqrt decomposition**: $O(\sqrt{n})$ per query and update. Much simpler to implement. Good enough when $n \leq 10^5$ and you want fast coding time over optimal asymptotic complexity.
