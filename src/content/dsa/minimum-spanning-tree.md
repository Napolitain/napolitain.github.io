---
title: "Minimum Spanning Tree"
description: "Find the subset of edges that connects all vertices with minimum total weight. Kruskal's and Prim's are the two classic approaches."
date: 2026-03-06
tags: ["graphs", "greedy", "mst", "union-find"]
draft: false
visualization: "MstVisualization"
family: "graph"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["graph-fundamentals", "greedy", "union-find", "heap"]
related: ["dijkstra"]
enables: []
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

## Key takeaways

- **Cut property is the core insight** — the lightest edge crossing any cut must be in the MST, which is why both Kruskal's and Prim's work by greedily picking minimum-weight edges.
- **Kruskal's for sparse, Prim's for dense** — Kruskal's $O(E \log E)$ wins when $E \approx V$; Prim's $O(V^2)$ array version wins when $E \approx V^2$ because it avoids sorting all edges.
- **Union-Find makes Kruskal's practical** — without path compression and union by rank, cycle detection would dominate the runtime.
- **Distinct weights guarantee a unique MST** — with ties multiple MSTs may exist, but they all share the same total weight.
- **MST ≠ shortest paths** — the MST minimizes total edge weight (and minimax path weight), while Dijkstra minimizes cumulative distance from a source.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/) | 🟡 Medium | Build MST on a complete graph of points using Kruskal's or Prim's |
| [Connecting Cities With Minimum Cost](https://leetcode.com/problems/connecting-cities-with-minimum-cost/) | 🟡 Medium | Classic MST — sort edges and use Union-Find to connect all cities |
| [Optimize Water Distribution in a Village](https://leetcode.com/problems/optimize-water-distribution-in-a-village/) | 🔴 Hard | Add a virtual node for wells, reducing the problem to standard MST |
| [Find Critical and Pseudo-Critical Edges in MST](https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/) | 🔴 Hard | Force-include and force-exclude each edge to classify criticality |
| [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | 🟡 Medium | Dijkstra on weighted graph — contrasts with MST by minimizing path distance instead of total weight |

## Relation to other topics

- **Union-Find**: Kruskal's is the canonical use case — Union-Find provides near-$O(1)$ cycle detection.
- **Dijkstra**: Prim's shares the same structure (greedy expansion with a priority queue), but uses edge weight rather than cumulative distance from the source.
- **Borůvka**: each component picks its cheapest outgoing edge simultaneously, merging in $O(\log V)$ phases. Useful in parallel and distributed settings.
