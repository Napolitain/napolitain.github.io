---
title: "Li Chao Tree"
description: "Maintain dynamic line insertion and min/max queries by storing line candidates in a segment tree over x-values."
date: 2026-03-07
tags: ["lines", "range-query", "rare"]
draft: false
visualization: "LiChaoTreeVisualization"
family: "range-query"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["convex-hull-trick", "segment-tree"]
related: ["persistent-segment-tree", "convex-hull-trick"]
enables: []
---

## Problem

Static Convex Hull Trick variants often need monotonic slopes, monotonic queries, or sortable intersection points.

What if lines arrive online in arbitrary order and you still want fast best-line queries at `x`?

## Core idea

Build a segment tree over the x-domain.

Each node stores one candidate line. Compare the current node line and the inserted line at the midpoint:

- keep the better line at the midpoint in the node
- recurse with the worse line only into the side where it might still win

That local midpoint decision is enough to maintain the global envelope.

## Why it matters

Li Chao is the dynamic, segment-tree flavored version of line-envelope optimization.

It trades some geometric elegance for much easier online updates.

## Complexity

| Operation | Time |
|---|---|
| Insert one line | $O(\log X)$ |
| Query best value at x | $O(\log X)$ |

Here `X` refers to the coordinate domain size or compressed coordinate count.

## Key takeaways

- Li Chao tree solves dynamic line insertion plus min/max queries
- It is the natural next step after learning the idea behind Convex Hull Trick
- The data structure feels like a segment tree because it literally is one over the x-domain
- This is rare advanced material, but very high signal once DP optimizations become dynamic

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Line Add Get Min](https://judge.yosupo.jp/problem/line_add_get_min) | 🔴 Hard | Canonical Li Chao benchmark |
| [Li Chao references](https://cp-algorithms.com/geometry/convex_hull_trick.html#li-chao-tree) | 🔴 Hard | Midpoint-based line swapping |
| [Dynamic DP optimization references](https://usaco.guide/plat/convex-hull-trick) | 🔴 Hard | Online envelope maintenance |

## Relation to other topics

- **Convex Hull Trick** provides the geometric optimization idea
- **Segment Tree** explains the interval recursion shape of the structure
- **Persistent Segment Tree** is another advanced segment-tree variant, but for versioning rather than line envelopes
