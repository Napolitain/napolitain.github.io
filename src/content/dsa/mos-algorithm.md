---
title: "Mo's Algorithm"
description: "Reorder offline range queries so a moving window can answer them with small pointer adjustments instead of rebuilding from scratch."
date: 2026-03-07
tags: ["range-query", "offline", "rare"]
draft: false
visualization: "MosAlgorithmVisualization"
family: "range-query"
kind: "technique"
difficulty: "advanced"
prerequisites: ["prefix-sum"]
related: ["segment-tree", "persistent-segment-tree", "dsu-rollback"]
enables: []
---

## Problem

You have many range queries on a static array, but the merge operation is awkward enough that prefix sums are impossible and segment trees are inconvenient.

## Core idea

Sort the queries in block order, usually by:

- `L / blockSize`
- then `R`

Now sweep through the queries with a current range `[curL, curR]`. For each new query, adjust the endpoints a little and update the answer incrementally.

The algorithm wins by making consecutive queries similar.

## Why it matters

Mo's algorithm is the standard answer when:

- queries are offline
- updates are absent or heavily restricted
- you can add/remove one element from the current range quickly
- no nice associative segment-tree merge is available

## Complexity

Classic ordering gives about:

$$
O((n + q) \sqrt{n})
$$

plus the cost of your add/remove operations.

## Key takeaways

- Mo's algorithm is about **query ordering**, not a new data structure
- It is useful when local add/remove updates are easy but direct merges are hard
- Offline constraints are essential: you must know all queries beforehand
- This is rare advanced range-query material, but extremely high-signal for contest-style problems

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Powerful Array](https://codeforces.com/problemset/problem/86/D) | 🔴 Hard | Classic Mo's ordering |
| [Distinct Values Queries](https://cses.fi/problemset/task/1734/) | 🔴 Hard | Offline range distinct counts |
| [Mo's references](https://cp-algorithms.com/data_structures/sqrt_decomposition.html#mos-algorithm) | 🔴 Hard | Range reordering logic |

## Relation to other topics

- **Prefix Sum** is what you would use if the query were additive and simple
- **Segment Tree** is the online merge-friendly alternative
- **DSU Rollback** is another offline trick where time gets reordered or rewound strategically
