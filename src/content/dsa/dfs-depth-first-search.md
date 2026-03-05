---
title: "DFS — Depth-First Search"
description: "Dive as deep as possible before backtracking. DFS is essential for detecting cycles, topological sorting, and exploring all paths in a graph."
date: 2026-03-05
tags: ["graphs", "dfs", "tree", "recursion", "stack"]
difficulty: "medium"
draft: false
visualization: "DfsVisualization"
---

## Problem

Given a graph and a starting node, explore as **deep** as possible along each branch before backtracking.

## Intuition

DFS uses a **stack** (explicitly or via recursion). You push the start node, then repeatedly pop a node, mark it visited, and push all its unvisited neighbors. Because stacks are LIFO, you always follow the most recently discovered path first — going deep before going wide.

## Algorithm

```
DFS(graph, start):
    stack ← [start]
    visited ← {}

    while stack is not empty:
        node ← stack.pop()
        if node in visited:
            continue
        visited.add(node)
        process(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                stack.push(neighbor)
```

### Recursive variant

```
DFS(graph, node, visited):
    visited.add(node)
    process(node)

    for neighbor in graph[node]:
        if neighbor not in visited:
            DFS(graph, neighbor, visited)
```

## Complexity

| | Time | Space |
|---|---|---|
| DFS | $O(V + E)$ | $O(V)$ |

## Key Observations

- DFS is the basis for **cycle detection**, **topological sort**, and finding **connected components**
- The recursive version maps naturally to tree problems (pre-order, in-order, post-order)
- Unlike BFS, DFS does **not** guarantee the shortest path
- Stack depth can hit $O(V)$ in the worst case — watch out for stack overflow on deep graphs
