---
title: "0-1 BFS"
description: "Find shortest paths in graphs whose edge weights are only 0 or 1 using a deque instead of a heap."
date: 2026-03-07
tags: ["graphs", "shortest-path", "deque", "rare"]
draft: false
visualization: "ZeroOneBfsVisualization"
family: "graph"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["graph-fundamentals", "bfs-breadth-first-search", "deque"]
related: ["dijkstra", "tree-fundamentals"]
enables: []
---

## Problem

You need shortest paths from one source, but edge weights are restricted to only **0** or **1**.

A normal BFS fails because weights are not uniform. Dijkstra works, but a heap is unnecessary overhead because there are only two possible distance increments.

That special structure is exactly what 0-1 BFS exploits.

## Key insight

When you relax an edge:

- weight `0` means the neighbor should be processed **as soon as possible**
- weight `1` means the neighbor belongs **one layer later**

So the frontier can be maintained with a **deque**:

- push to the **front** for a 0-edge
- push to the **back** for a 1-edge

That keeps nodes in nondecreasing distance order without a priority queue.

## Algorithm

```
dist[source] <- 0
deque <- [source]

while deque not empty:
    u <- pop_front()

    for (v, w) in adj[u]:
        if dist[u] + w < dist[v]:
            dist[v] <- dist[u] + w
            if w == 0:
                push_front(v)
            else:
                push_back(v)
```

This looks like Dijkstra, but the priority structure collapses into a deque because weights are so constrained.

## Why it works

At any moment, nodes in the deque differ in tentative distance by at most 1.

- front side = current best distance bucket
- back side = next bucket

That is why the deque is enough. You never need a full heap ordering.

## Complexity

| Operation | Time |
|---|---|
| Full shortest paths | $O(V + E)$ |

Each edge is relaxed in the same linear style as BFS.

## When to use it

Use 0-1 BFS when all edge weights are binary:

- teleport or normal move
- free or paid transition
- same-color edge vs color-change edge
- reverse-edge constructions where one direction costs 0 and the other costs 1

If weights can be larger than 1, switch to Dijkstra or another shortest-path method.

## Key takeaways

- 0-1 BFS sits between BFS and Dijkstra
- It is really **Dijkstra with a deque** because the key space is only `{0, 1}`
- Deques are not just linear containers; they unlock this shortest-path trick directly
- This is niche, but when the constraint fits, it is both elegant and fast

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Minimum Cost to Make at Least One Valid Path in a Grid](https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/) | 🔴 Hard | Direction-following moves cost 0, changes cost 1 |
| [Shortest Path in Binary Matrix variants](https://leetcode.com/) | varies | Binary-weight transitions often reduce to 0-1 BFS |
| [Chef and Reversing](https://www.codechef.com/problems/REVERSE) | 🟡 Medium | Original direction 0, reversed edge 1 |

## Relation to other topics

- **BFS** handles unweighted shortest paths
- **Dijkstra** handles general nonnegative weights
- **Deque** is the enabling data structure that makes this optimization work
