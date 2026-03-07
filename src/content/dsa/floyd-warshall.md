---
title: "Floyd-Warshall"
description: "Compute all-pairs shortest paths by gradually allowing more intermediate vertices. This is the clean dynamic-programming answer to dense shortest-path queries."
date: 2026-03-07
tags: ["graphs", "shortest-path", "dynamic-programming"]
draft: false
visualization: "FloydWarshallVisualization"
family: "graph"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["graph-fundamentals", "dynamic-programming"]
related: ["dijkstra", "tarjan-scc"]
enables: []
---

## Problem

You need shortest paths between **every** pair of vertices, not just from one source.

Running Dijkstra from every vertex can work, but for dense graphs or when you want a conceptually direct all-pairs method, Floyd-Warshall is the classic choice.

## Core idea

Let `dist[i][j]` be the best known path from `i` to `j`.

Then process vertices one by one as allowed intermediates:

$$
dist[i][j] = \min(dist[i][j], dist[i][k] + dist[k][j])
$$

At stage `k`, you ask:

> is the best path from `i` to `j` better if I am allowed to route through vertex `k`?

That is a pure dynamic-programming recurrence.

## Why it matters

Floyd-Warshall is the cleanest demonstration that shortest paths are not only about greedy algorithms like Dijkstra. Sometimes the right model is a DP over allowed intermediates.

It also handles negative edge weights, as long as there is no negative cycle.

## Complexity

| Operation | Time | Space |
|---|---|---|
| All-pairs shortest paths | $O(n^3)$ | $O(n^2)$ |

This is expensive for large sparse graphs, but excellent for dense graphs or small `n`.

## Key takeaways

- Floyd-Warshall is the standard all-pairs shortest-path DP
- It is cubic, so it shines when `n` is modest or the graph is dense
- Unlike Dijkstra, it can handle negative edges if there is no negative cycle
- This fills the gap between single-source shortest paths and full reachability analysis

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Find the City With the Smallest Number of Neighbors at a Threshold Distance](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/) | 🟡 Medium | All-pairs distances on modest `n` |
| [Shortest Routes II](https://cses.fi/problemset/task/1672/) | 🟡 Medium | Multiple pair queries after preprocessing |
| [Arbitrage / transitive closure variants](https://cp-algorithms.com/graph/all-pair-shortest-path-floyd-warshall.html) | 🔴 Hard | DP over intermediates |

## Relation to other topics

- **Dijkstra** is better for single-source nonnegative shortest paths
- **Dynamic Programming** explains the recurrence structure directly
- **Graph Fundamentals** provides the weighted-path model Floyd-Warshall operates on
