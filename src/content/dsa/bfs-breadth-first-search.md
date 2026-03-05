---
title: "BFS — Breadth-First Search"
description: "Explore a graph level by level using a queue. BFS finds the shortest path in unweighted graphs and is fundamental to many graph algorithms."
date: 2026-03-05
tags: ["graphs", "bfs", "shortest-path", "queue"]
difficulty: "medium"
draft: false
visualization: "BfsVisualization"
---

## Problem

Given a graph and a starting node, visit every reachable node in **breadth-first order** — processing all neighbors of the current node before moving deeper.

## Intuition

BFS uses a **queue** (FIFO). You push the start node, then repeatedly dequeue a node, mark it visited, and enqueue all its unvisited neighbors. Because you process nodes in the order they were discovered, you naturally visit them **level by level**.

## Algorithm

```
BFS(graph, start):
    queue ← [start]
    visited ← {start}

    while queue is not empty:
        node ← queue.dequeue()
        process(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.enqueue(neighbor)
```

## Complexity

| | Time | Space |
|---|---|---|
| BFS | $O(V + E)$ | $O(V)$ |

Where $V$ is the number of vertices and $E$ is the number of edges.

## Key Observations

- BFS finds the **shortest path** (in terms of edge count) in unweighted graphs
- It naturally produces a **level-order traversal** of trees
- The queue guarantees we never skip a closer node to visit a farther one first
- BFS is the foundation for algorithms like Dijkstra (with a priority queue instead)
