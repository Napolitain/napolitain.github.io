---
title: "Tarjan SCC"
description: "Find strongly connected components in one DFS by tracking discovery times, low-link values, and the active stack."
date: 2026-03-07
tags: ["graphs", "scc", "low-link", "rare"]
draft: false
visualization: "TarjanSccVisualization"
family: "graph"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["graph-fundamentals", "dfs-depth-first-search"]
related: ["topological-sort", "bridges-articulation-points", "union-find"]
enables: []
---

## Problem

In a directed graph, a **strongly connected component** is a maximal set of vertices where every node can reach every other node.

You want to partition the graph into these SCCs efficiently.

## Core idea

Tarjan runs one DFS and maintains:

- `disc[u]`: discovery time
- `low[u]`: earliest discovery time reachable while staying inside the current DFS stack context
- a stack of nodes that belong to the current unresolved SCCs

When `low[u] == disc[u]`, node `u` is the root of one SCC, so everything on the stack up to `u` pops together.

## Why it works

The stack represents nodes still "open" in the DFS search tree. Low-link values tell you whether a subtree can reach an ancestor that is also still open.

If it cannot, that subtree has just closed into one SCC.

## Algorithm sketch

1. DFS into an unvisited node
2. assign `disc` and `low`
3. push the node onto the active stack
4. update `low` from tree edges and back edges to nodes still on the stack
5. when `low[u] == disc[u]`, pop one whole SCC

## Complexity

| Operation | Time |
|---|---|
| Full SCC decomposition | $O(V + E)$ |

## Key takeaways

- Tarjan finds SCCs in one DFS pass
- The stack matters: only edges to nodes still on the stack can shrink low-link values for SCC detection
- `low[u] == disc[u]` means "this node closes a component"
- This is a rare advanced graph topic, but it is foundational for serious directed-graph work

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Planets and Kingdoms](https://cses.fi/problemset/task/1683/) | 🔴 Hard | Build SCC decomposition |
| [Calling Circles](https://onlinejudge.org/external/247/247.pdf) | 🔴 Hard | Classic SCC grouping |
| [2-SAT references](https://cp-algorithms.com/graph/2SAT.html) | 🔴 Hard | SCCs on implication graphs |

## Relation to other topics

- **DFS** supplies the search tree and timestamps
- **Topological Sort** often appears after SCC condensation into a DAG
- **Bridges & Articulation Points** use related low-link ideas, but on undirected graphs
