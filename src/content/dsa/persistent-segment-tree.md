---
title: "Persistent Segment Tree"
description: "Keep every version of a segment tree by path-copying only the changed nodes."
date: 2026-03-07
tags: ["segment-tree", "persistence", "rare"]
draft: false
visualization: "PersistentSegmentTreeVisualization"
family: "range-query"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["segment-tree"]
related: ["heavy-light-decomposition", "mos-algorithm", "dsu-rollback"]
enables: []
---

## Problem

Sometimes you do not want only the latest array state. You want to ask queries against older versions too.

## Core idea

When a segment-tree update changes one leaf, only the nodes on that root-to-leaf path need new copies. Every untouched subtree can be shared with earlier versions.

So each update returns a **new root**, while old roots remain valid.

## Why it matters

Persistence turns "history" into something queryable.

That enables:

- range queries on old versions
- k-th order statistics over prefix versions
- time-travel style offline solutions

## Complexity

| Operation | Time | Extra space |
|---|---|---|
| One update creating a new version | $O(\log n)$ | $O(\log n)$ |
| One query on any version | $O(\log n)$ | - |

## Key takeaways

- Persistent segment trees save history by path-copying, not by cloning the whole structure
- A version is just a root pointer into mostly shared nodes
- This is rare advanced range-query material, but it is one of the cleanest persistence examples in DSA
- Heavy-light decomposition sometimes pairs with persistence when tree queries also need historical versions

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [K-th Number references](https://cp-algorithms.com/data_structures/segment_tree.html#finding-the-k-th-smallest-number-in-a-range) | 🔴 Hard | Prefix versions plus order statistics |
| [MKTHNUM](https://www.spoj.com/problems/MKTHNUM/) | 🔴 Hard | Classic persistent segment tree problem |
| [Persistent segment tree references](https://usaco.guide/adv/persistent?lang=cpp) | 🔴 Hard | Path copying and version roots |

## Relation to other topics

- **Segment Tree** is the non-persistent base structure
- **Heavy-Light Decomposition** can use segment trees on tree paths, and persistence can extend that story further
- **Mo's Algorithm** is another advanced answer when offline query structure matters more than online updates
