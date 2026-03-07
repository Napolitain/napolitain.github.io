---
title: "Binary Lifting"
description: "Jump upward in a rooted tree by powers of two to answer k-th ancestor and many LCA-style queries quickly."
date: 2026-03-07
tags: ["tree", "doubling", "lca", "rare"]
draft: false
visualization: "BinaryLiftingVisualization"
family: "tree"
kind: "technique"
difficulty: "advanced"
prerequisites: ["tree-fundamentals"]
related: ["euler-tour-technique", "sparse-table", "segment-tree"]
enables: []
---

## Problem

You have a rooted tree and want to answer questions like:

- what is the $k$-th ancestor of node `u`?
- can we jump upward quickly?
- how do LCA-style preprocessors avoid climbing one parent at a time?

If you move one edge per step, each query can take $O(n)$ in the worst case. Binary lifting reduces that to $O(\log n)$.

## Core idea

Precompute `up[u][j]` = the $2^j$-th ancestor of node `u`.

Examples:

- `up[u][0]` = parent of `u`
- `up[u][1]` = 2nd ancestor
- `up[u][2]` = 4th ancestor
- `up[u][3]` = 8th ancestor

This is the same doubling idea used by sparse tables, but the domain is a tree instead of an array.

## Build

First compute parents with DFS or BFS. Then fill the jump table:

```
up[u][0] <- parent[u]

for j in 1..LOG:
    up[u][j] <- up[ up[u][j-1] ][j-1]
```

If a jump leaves the tree, store `null`.

## Query

To move up by `k`, inspect the binary representation of `k`.

If:

$$
k = 13 = 8 + 4 + 1
$$

then jump by:

- $2^3$
- $2^2$
- $2^0$

Only the set bits matter.

## Why it is useful

Binary lifting directly solves:

- k-th ancestor queries
- level alignment in LCA
- many path and ancestor predicates

It is one of the standard rooted-tree preprocessors because it transforms repeated upward movement into a few table lookups.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Preprocessing | $O(n \log n)$ | $O(n \log n)$ |
| One k-th ancestor query | $O(\log n)$ | - |

## LCA connection

Lowest common ancestor is often built on top of binary lifting:

1. raise the deeper node until both are at the same depth
2. try large jumps downward from the top bit to the bottom bit
3. stop right before the nodes would become equal

That is why binary lifting is often taught as “ancestor jumps,” even though its most common use is enabling LCA.

## Key takeaways

- Binary lifting is doubling on trees
- Queries work by decomposing a jump count into powers of two
- Sparse tables and binary lifting are close cousins conceptually
- It is uncommon in beginner interviews, but very important for serious tree-query work

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Kth Ancestor of a Tree Node](https://leetcode.com/problems/kth-ancestor-of-a-tree-node/) | 🟡 Medium | Direct binary lifting |
| [Company Queries I](https://cses.fi/problemset/task/1687/) | 🟡 Medium | Rooted tree ancestor jumps |
| [Lowest Common Ancestor](https://cp-algorithms.com/graph/lca_binary_lifting.html) | 🔴 Hard | Binary lifting plus depth alignment |

## Relation to other topics

- **Tree fundamentals** gives the rooted-parent model binary lifting depends on
- **Euler tour technique** helps with subtree queries, while binary lifting helps with ancestor queries
- **Sparse table** uses the same powers-of-two precomputation pattern in arrays
