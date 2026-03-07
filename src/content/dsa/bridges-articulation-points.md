---
title: "Bridges and Articulation Points"
description: "Use DFS timestamps and low-link values to find the edges and vertices whose removal disconnects an undirected graph."
date: 2026-03-07
tags: ["graphs", "bridges", "articulation-points", "rare"]
draft: false
visualization: "BridgesArticulationVisualization"
family: "graph"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["graph-fundamentals", "dfs-depth-first-search"]
related: ["tarjan-scc", "union-find", "eulerian-path"]
enables: []
---

## Problem

In an undirected graph, you may want to know:

- which edges are critical connections
- which vertices are critical junctions

A **bridge** is an edge whose removal increases the number of connected components. An **articulation point** is a vertex whose removal does the same.

## Core idea

During DFS, record:

- `disc[u]`: when `u` was first discovered
- `low[u]`: earliest discovery time reachable from `u`'s subtree using at most one back edge

That single low-link concept answers both questions.

## Bridge rule

For a DFS tree edge `u -> v`:

$$
low[v] > disc[u]
$$

means the subtree of `v` cannot climb back above `u`, so removing `(u, v)` disconnects the graph.

## Articulation-point rule

A non-root node `u` is an articulation point if it has a DFS child `v` such that:

$$
low[v] \ge disc[u]
$$

A root is an articulation point when it has more than one DFS child.

## Why it matters

These problems are where many people first see low-link values outside SCCs.

They matter in:

- network reliability
- road or server criticality
- block-cut trees and biconnected components
- "critical connection" interview variants

## Complexity

| Operation | Time |
|---|---|
| Find all bridges/articulation points | $O(V + E)$ |

## Key takeaways

- One DFS plus low-link values solves both bridge and articulation-point detection
- Bridges talk about critical **edges**; articulation points talk about critical **vertices**
- The inequalities differ slightly: `>` for bridges, `>=` for articulation children
- This is rare advanced graph material, but it fills an important gap between basic traversal and serious connectivity analysis

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/) | 🔴 Hard | Bridge detection |
| [Submerging Islands](https://onlinejudge.org/external/3/315.pdf) | 🔴 Hard | Articulation points |
| [Necessary Roads](https://cses.fi/problemset/task/2076/) | 🔴 Hard | Bridge reporting |

## Relation to other topics

- **DFS** provides the discovery tree and back edges
- **Tarjan SCC** uses related low-link reasoning on directed graphs
- **Eulerian Path** is another graph-structure topic that depends on understanding connectivity constraints
