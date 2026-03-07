---
title: "Union-Find (Disjoint Set)"
description: "Track connected components efficiently with near-constant time union and find operations. The backbone of Kruskal's MST and dynamic connectivity."
date: 2026-03-05
tags: ["graphs", "union-find", "tree", "connected-components"]
draft: false
visualization: "UnionFindVisualization"
family: "graph"
kind: "data-structure"
difficulty: "intermediate"
prerequisites: ["graph-fundamentals"]
related: ["minimum-spanning-tree", "tree-fundamentals"]
enables: ["minimum-spanning-tree"]
---

## Problem

Maintain a collection of **disjoint sets** that support two operations:
- **Find(x)**: which set does element $x$ belong to?
- **Union(x, y)**: merge the sets containing $x$ and $y$

## Intuition

Think of it as a forest of trees. Each set is a tree, and the **root** of the tree is the representative of that set. `Find(x)` walks up from $x$ to the root. `Union(x, y)` finds both roots and makes one point to the other.

Without optimizations, this can degenerate to a linked list ($O(n)$ per find). Two optimizations make it nearly $O(1)$ amortized:

1. **Path compression**: during `Find`, make every node on the path point directly to the root
2. **Union by rank** (or size): attach the shorter tree under the taller tree

With both optimizations, the amortized cost per operation is $O(\alpha(n))$ — the inverse Ackermann function — which is effectively constant for all practical input sizes ($\alpha(n) \leq 4$ for $n < 10^{80}$).

## Algorithm

```
parent ← [0, 1, 2, ..., n-1]  // each node is its own parent
rank ← [0, 0, 0, ..., 0]

Find(x):
    if parent[x] ≠ x:
        parent[x] ← Find(parent[x])  // path compression
    return parent[x]

Union(x, y):
    rx ← Find(x)
    ry ← Find(y)
    if rx == ry: return  // already in same set

    // union by rank
    if rank[rx] < rank[ry]:
        parent[rx] ← ry
    else if rank[rx] > rank[ry]:
        parent[ry] ← rx
    else:
        parent[ry] ← rx
        rank[rx] += 1
```

### Path compression in detail

Without path compression, `Find` walks the chain: $x \to parent[x] \to parent[parent[x]] \to \ldots \to root$. Path compression flattens this by making every node on the path point directly to the root. The next `Find` on any of these nodes is $O(1)$.

```
Find(5): 5 → 3 → 1 → 0 (root)
After:   5 → 0, 3 → 0, 1 → 0
```

### Union by rank in detail

Rank is an upper bound on tree height. When merging two trees, attach the shorter one under the taller one. This keeps the tree shallow. If both trees have the same rank, pick either as root and increment its rank by 1.

An alternative is **union by size** — attach the smaller set under the larger one. Both give the same asymptotic bound.

## Cycle detection in undirected graphs

To check if adding edge $(u, v)$ creates a cycle: if `Find(u) == Find(v)`, then $u$ and $v$ are already connected, so adding the edge creates a cycle. Otherwise, `Union(u, v)`.

```
for each edge (u, v) in graph:
    if Find(u) == Find(v):
        "cycle detected"
    else:
        Union(u, v)
```

This is simpler than DFS-based cycle detection for undirected graphs and runs in nearly $O(E \cdot \alpha(V))$ time.

## Kruskal's MST

Union-Find is the core data structure in Kruskal's Minimum Spanning Tree algorithm:

1. Sort all edges by weight
2. For each edge $(u, v, w)$ in sorted order:
   - If `Find(u) ≠ Find(v)`: add edge to MST, `Union(u, v)`
   - Otherwise: skip (would create a cycle)
3. Stop when MST has $V-1$ edges

The sorting is $O(E \log E)$, and each union/find is $O(\alpha(V))$, so total is $O(E \log E)$.

## Counting connected components

Initialize with $n$ components (one per node). Each successful `Union` decrements the count by 1. At the end, the count tells you how many connected components exist.

```
components ← n
for each edge (u, v):
    if Find(u) ≠ Find(v):
        Union(u, v)
        components -= 1
```

## When to use Union-Find vs DFS/BFS

| Problem | Union-Find | DFS/BFS |
|---|---|---|
| Static connectivity (all edges known) | Works, but overkill | Simple traversal suffices |
| Dynamic connectivity (edges added over time) | **Best choice** | Must re-traverse |
| Cycle detection (undirected) | Clean and fast | Also works (track parent) |
| Kruskal's MST | Required | N/A |
| Shortest path | Not applicable | Use BFS/Dijkstra |

Union-Find shines when edges arrive **incrementally** and you need to answer "are these connected?" queries along the way. DFS/BFS is better for one-shot traversal problems.

## Complexity

| Operation | Time (amortized) | Space |
|---|---|---|
| Find | $O(\alpha(n))$ ≈ $O(1)$ | — |
| Union | $O(\alpha(n))$ ≈ $O(1)$ | — |
| Total space | — | $O(n)$ |

Where $\alpha$ is the inverse Ackermann function. For all practical purposes, this is constant.

## Key takeaways

- **Always use both path compression and union by rank** — together they give $O(\alpha(n))$ amortized per operation, which is effectively constant.
- **Union-Find excels at incremental connectivity** — when edges arrive over time and you need on-the-fly "are these connected?" queries, it beats DFS/BFS.
- **Cycle detection is trivial** — if `Find(u) == Find(v)` before adding edge $(u, v)$, a cycle exists.
- **Count components by tracking successful unions** — start with $n$ components and decrement on each union of distinct sets.
- **Think Union-Find whenever you see equivalence classes** — grouping accounts, merging intervals, or partitioning elements by some equivalence relation.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | 🟡 Medium | Count connected components by union-ing adjacent nodes |
| [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | 🟡 Medium | Find the edge that creates a cycle using union-find |
| [Accounts Merge](https://leetcode.com/problems/accounts-merge/) | 🟡 Medium | Union accounts sharing an email, then group by root |
| [Most Stones Removed with Same Row or Column](https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/) | 🟡 Medium | Stones in the same row/column form a connected component |
| [Satisfiability of Equality Equations](https://leetcode.com/problems/satisfiability-of-equality-equations/) | 🟡 Medium | Union variables in equality constraints, then check inequality constraints |

## Relation to other topics

- **Kruskal's MST** — Union-Find is the core data structure that makes Kruskal's algorithm efficient by quickly testing whether an edge connects two different components.
- **Graph traversal (DFS/BFS)** — for static graphs where all edges are known upfront, DFS/BFS is simpler; Union-Find wins when edges arrive incrementally.
- **Connected components** — Union-Find and BFS/DFS both solve this, but Union-Find supports dynamic edge insertion without re-traversal.
