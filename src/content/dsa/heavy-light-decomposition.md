---
title: "Heavy-Light Decomposition"
description: "Break tree paths into O(log n) heavy-chain segments so path queries can ride on top of a segment tree instead of walking edge by edge."
date: 2026-03-07
tags: ["tree", "path-queries", "segment-tree", "rare"]
draft: false
visualization: "HeavyLightDecompositionVisualization"
family: "tree"
kind: "technique"
difficulty: "advanced"
prerequisites: ["tree-fundamentals", "dfs-depth-first-search", "lowest-common-ancestor", "segment-tree"]
related: ["binary-lifting", "euler-tour-technique", "lowest-common-ancestor", "persistent-segment-tree"]
enables: ["persistent-segment-tree"]
---

## Problem

Subtree queries are pleasant after an Euler tour because a subtree becomes one interval. Path queries are harder.

Examples:

- sum along the path from `u` to `v`
- maximum edge on a path
- update every node on a path

A path is not usually one contiguous subtree interval, so you need another reduction.

## Core idea

For every node, mark one child as **heavy**: usually the child with the largest subtree. The remaining child edges are **light**.

Heavy edges form disjoint chains. The key fact is:

> any root-to-node path crosses only O(log n) light edges

So any path between two nodes can be decomposed into only O(log n) chain segments.

Once each chain is flattened into a base array, a segment tree can answer queries on each segment.

## Query sketch

The usual pattern is:

1. while the chain heads of `u` and `v` differ
2. move the deeper chain head upward
3. query that whole chain segment in the base array
4. when both nodes land on the same chain, finish with one last contiguous segment

That turns one hard tree path into a small number of range queries.

## Why it matters

Heavy-light decomposition is the path-query counterpart to Euler tour.

- Euler tour is best when you care about **subtrees**
- HLD is best when you care about **paths**

Together, they complete the mental model for turning trees into arrays.

## Complexity

| Operation | Time |
|---|---|
| Preprocessing decomposition | $O(n)$ or $O(n \log n)$ depending on implementation details |
| One path query/update with segment tree | $O(\log^2 n)$ |

With more specialized structures, some implementations reduce constants or one logarithm, but the classic version is $O(\log^2 n)$.

## Key takeaways

- HLD is the standard reduction for path queries on trees
- The win comes from crossing only O(log n) light edges
- Segment trees usually sit underneath the decomposition
- This is a rare advanced topic, but it is the natural next step after LCA and Euler tour

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Path Queries II](https://cses.fi/problemset/task/2134/) | 🔴 Hard | Classic HLD plus segment tree |
| [Query on a tree again!](https://www.spoj.com/problems/QTREE/) | 🔴 Hard | Edge/path queries with HLD |
| [Cow Land](https://usaco.org/index.php?page=viewproblem2&cpid=921) | 🔴 Hard | Tree path xor queries |

## Relation to other topics

- **Lowest Common Ancestor** helps reason about path structure and split points
- **Euler Tour Technique** solves subtree intervals, while HLD solves arbitrary path intervals
- **Segment Tree** is the usual range structure placed on top of the decomposed chains
- **Persistent Segment Tree** is one possible upgrade once ordinary HLD feels comfortable
