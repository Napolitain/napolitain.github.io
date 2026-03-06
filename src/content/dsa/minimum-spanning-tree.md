---
title: "Minimum Spanning Tree"
description: "Find the subset of edges that connects all vertices with minimum total weight. Kruskal's and Prim's are the two classic approaches."
date: 2026-03-06
tags: ["graphs", "greedy", "mst", "union-find"]
draft: false
visualization: "MstVisualization"
---

## Problem

Given a **connected, undirected, weighted** graph $G = (V, E)$, find a spanning tree $T \subseteq E$ such that the total edge weight $\sum_{e \in T} w(e)$ is minimized. A spanning tree connects all $V$ vertices using exactly $V - 1$ edges with no cycles.

## Intuition

A **spanning tree** is any acyclic subgraph that connects every vertex. Among all possible spanning trees, the MST has the smallest total weight. Two properties drive the classic algorithms:

- **Cut property**: for any cut $(S, V \setminus S)$, the minimum-weight edge crossing the cut is in every MST (assuming distinct weights). This justifies greedily picking light edges.
- **Cycle property**: for any cycle in $G$, the maximum-weight edge in that cycle is **not** in any MST. This justifies discarding heavy edges that would form cycles.

## Kruskal's algorithm

Sort all edges by weight, then greedily add each edge if it doesn't create a cycle. Use **Union-Find** to check connectivity in near-constant time.

```
Kruskal(V, E):
    sort E by weight ascending
    UF ← UnionFind(V)
    mst ← []

    for (u, v, w) in E:
        if UF.find(u) ≠ UF.find(v):
            mst.append((u, v, w))
            UF.union(u, v)
        if |mst| == |V| - 1:
            break
    return mst
```

The bottleneck is the sort: $O(E \log E)$. Each union/find is $O(\alpha(V))$, so the Union-Find work totals $O(E \cdot \alpha(V))$.

## Prim's algorithm

Grow the MST from a starting vertex by always adding the cheapest edge connecting a tree vertex to a non-tree vertex. This is Dijkstra's algorithm but tracking **edge weight** instead of **cumulative distance**.

```
Prim(graph, start):
    inMST ← {start}
    pq ← MinHeap()
    for (v, w) in graph[start]:
        pq.insert((w, start, v))
    mst ← []

    while |inMST| < |V|:
        (w, u, v) ← pq.extract_min()
        if v in inMST: continue
        inMST.add(v)
        mst.append((u, v, w))
        for (next, nw) in graph[v]:
            if next ∉ inMST:
                pq.insert((nw, v, next))
    return mst
```

## Kruskal vs Prim

| | Kruskal | Prim (binary heap) |
|---|---|---|
| Best for | Sparse graphs ($E \approx V$) | Dense graphs ($E \approx V^2$) |
| Data structure | Union-Find | Priority queue |
| Edge list needed? | Yes (sorts all edges) | No (adjacency list) |
| Parallelizable | Easy (filter-kruskal) | Harder |

For sparse graphs, Kruskal's $O(E \log E)$ dominates because $E$ is small. For dense graphs, Prim's with an adjacency matrix runs in $O(V^2)$, avoiding the costly sort when $E \approx V^2$.

## Properties of MSTs

- **Uniqueness**: if all edge weights are **distinct**, the MST is unique. With ties, multiple MSTs may exist but all share the same total weight.
- **Cycle property**: the heaviest edge in any cycle is never in an MST.
- **Cut property**: the lightest edge across any cut is always in the MST (with distinct weights).
- **Edge count**: always exactly $V - 1$.
- **Minimax path**: the MST minimizes the maximum edge weight on the path between any two vertices.

## Common variations

- **Maximum spanning tree**: negate all weights and run Kruskal/Prim, or sort descending in Kruskal's.
- **Second-best MST**: for each non-MST edge $(u, v)$, find the max-weight edge on the MST path $u \to v$. Swap the pair with smallest difference. $O(E \log V)$ with LCA.
- **MST on complete graphs**: Prim's with a flat array runs in $O(V^2)$, matching the number of edges.
- **Steiner tree**: MST over a subset of vertices — NP-hard in general.

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| Kruskal (Union-Find) | $O(E \log E)$ | $O(V + E)$ |
| Prim (binary heap) | $O((V + E) \log V)$ | $O(V + E)$ |
| Prim (Fibonacci heap) | $O(E + V \log V)$ | $O(V + E)$ |
| Prim (array, no heap) | $O(V^2)$ | $O(V)$ |
| Borůvka | $O(E \log V)$ | $O(V + E)$ |

## Relation to other algorithms

- **Union-Find**: Kruskal's is the canonical use case — Union-Find provides near-$O(1)$ cycle detection.
- **Dijkstra**: Prim's shares the same structure (greedy expansion with a priority queue), but uses edge weight rather than cumulative distance from the source.
- **Borůvka**: each component picks its cheapest outgoing edge simultaneously, merging in $O(\log V)$ phases. Useful in parallel and distributed settings.
