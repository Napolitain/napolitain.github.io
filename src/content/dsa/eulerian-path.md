---
title: "Eulerian Path"
description: "Traverse every edge exactly once by checking degree conditions and then building the walk with Hierholzer's algorithm."
date: 2026-03-07
tags: ["graphs", "paths", "stack", "connectivity"]
draft: false
visualization: "EulerianPathVisualization"
family: "graph"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["graph-fundamentals", "dfs-depth-first-search"]
related: ["bridges-articulation-points", "stack"]
enables: []
---

## Problem

An Eulerian path visits **every edge exactly once**. If it starts and ends at the same vertex, it is an Eulerian circuit.

This is a graph-structure problem, not a shortest-path problem.

## Core idea

First verify the graph has the right degree pattern.

For undirected graphs:

- circuit: every non-isolated vertex has even degree
- path: exactly two vertices have odd degree

Then build the walk with **Hierholzer's algorithm**:

1. keep walking unused edges while possible
2. push vertices on a stack
3. when stuck, pop into the answer

The path is constructed in reverse order.

## Why it works

Whenever you reach a dead end, that piece must belong at the end of the unfinished Eulerian walk. Backtracking stitches local cycles and trails together automatically.

## Complexity

| Operation | Time |
|---|---|
| Build Eulerian path/circuit | $O(V + E)$ |

## Key takeaways

- Eulerian paths care about **edge usage**, not vertex reachability or shortest distance
- Degree conditions tell you whether a solution can exist before you even build it
- Hierholzer's algorithm is a stack-based constructive proof
- This topic completes an important graph-structure branch beyond traversal and shortest paths

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Reconstruct Itinerary](https://leetcode.com/problems/reconstruct-itinerary/) | 🔴 Hard | Hierholzer on a directed multigraph with lexical tie-breaking |
| [Teleporters Path](https://cses.fi/problemset/task/1693/) | 🔴 Hard | Directed Eulerian path |
| [Valid Arrangement of Pairs](https://leetcode.com/problems/valid-arrangement-of-pairs/) | 🔴 Hard | Eulerian trail framing |

## Relation to other topics

- **DFS** helps verify the relevant connected component structure
- **Stack** is the implementation backbone of Hierholzer's algorithm
- **Bridges & Articulation Points** study critical structure, while Eulerian paths study exact edge coverage structure
