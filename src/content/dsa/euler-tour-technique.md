---
title: "Euler Tour Technique"
description: "Flatten a rooted tree into an array so subtree problems become range problems. This is the bridge between trees and range-query structures."
date: 2026-03-07
tags: ["tree", "dfs", "range-query", "rare"]
draft: false
visualization: "EulerTourVisualization"
family: "tree"
kind: "technique"
difficulty: "advanced"
prerequisites: ["tree-fundamentals", "dfs-depth-first-search"]
related: ["fenwick-tree", "segment-tree", "binary-lifting", "lowest-common-ancestor", "heavy-light-decomposition", "persistent-segment-tree"]
enables: ["binary-lifting", "lowest-common-ancestor", "heavy-light-decomposition"]
---

## Problem

Tree problems often ask for operations on an entire subtree:

- sum values in a subtree
- add something to every node in a subtree
- answer queries about descendants

Trees are awkward for direct range machinery, but arrays are not. The Euler tour technique converts the tree into an array while preserving subtree contiguity.

## Core idea

Run a DFS and record when each node is first visited.

If `tin[u]` is the entry time of node `u`, then every node in the subtree of `u` appears in one contiguous segment of the DFS order.

That means:

$$
\text{subtree}(u) \leftrightarrow [tin[u], tout[u]]
$$

Now subtree queries become ordinary array range queries.

## Simple flattening

One common version stores each node once, at entry time:

```
dfs(u, p):
    tin[u] <- timer
    order[timer] <- u
    timer <- timer + 1

    for v in children(u):
        if v != p:
            dfs(v, u)

    tout[u] <- timer - 1
```

With this representation, the subtree of `u` is exactly the interval `[tin[u], tout[u]]`.

## Why it matters

Euler tour is not the final answer by itself. It is a **reduction**.

Once the tree is flattened, you can use:

- Fenwick tree for subtree sums or adds
- segment tree for richer subtree range operations
- prefix sums for static subtree aggregates

This is why the technique shows up everywhere in competitive programming and query-heavy tree problems.

## Common variants

### Entry-only tour
Store each node once. Best for subtree intervals.

### Full Euler tour
Store a node each time you enter or leave it. Useful for LCA reductions and traversal traces.

### Subtree size form
If you compute subtree sizes, then:

$$
\text{subtree}(u) = [tin[u], tin[u] + size[u] - 1]
$$

Same idea, different bookkeeping.

## Complexity

| Operation | Time | Space |
|---|---|---|
| DFS flattening | $O(n)$ | $O(n)$ |

After flattening, the complexity depends on whatever range structure you place on top.

## Key takeaways

- Euler tour is the bridge between **trees** and **arrays**
- It works because DFS visits every subtree in one contiguous block
- By itself it does not answer queries; it makes trees compatible with Fenwick trees, segment trees, and prefix sums
- It is rare in beginner material, but extremely important once tree queries appear

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Subtree Queries](https://cses.fi/problemset/task/1137/) | 🟡 Medium | Flatten the tree, then use a Fenwick tree |
| [Company Queries I](https://cses.fi/problemset/task/1687/) | 🟡 Medium | Rooted tree preprocessing, often paired with binary lifting |
| [Path Queries](https://cses.fi/problemset/task/1138/) | 🔴 Hard | Euler tour plus a range-query structure |

## Relation to other topics

- **DFS** provides the traversal order that makes the flattening possible
- **Fenwick tree** and **segment tree** usually sit on top of the flattened array
- **Binary lifting** solves ancestor jumps; Euler tour solves subtree interval mapping
