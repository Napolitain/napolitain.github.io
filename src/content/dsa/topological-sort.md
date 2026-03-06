---
title: "Topological Sort"
description: "Order the nodes of a DAG so that every edge points forward. Essential for dependency resolution, build systems, and scheduling."
date: 2026-03-05
tags: ["graphs", "dfs", "dag", "topological-sort"]
draft: false
visualization: "TopoSortVisualization"
---

## Problem

Given a **directed acyclic graph** (DAG), produce a linear ordering of its nodes such that for every edge $u \to v$, node $u$ appears before $v$ in the ordering.

## Intuition

Think of it as a dependency graph. If task A must be done before task B ($A \to B$), then A must appear earlier in the sorted order. Topological sort finds any valid ordering that respects all these constraints.

There can be **multiple valid orderings**. The graph `A → C, B → C` can be sorted as either `[A, B, C]` or `[B, A, C]` — both are correct because A and B have no ordering constraint between them.

A topological ordering exists **if and only if** the graph has no cycles. A cycle means `A depends on B, B depends on C, C depends on A` — there's no way to order them linearly.

## DFS-based approach (reverse post-order)

Run DFS. When a node finishes (all its descendants are fully explored), push it onto a result stack. At the end, the stack — read top to bottom — is a valid topological order.

```
topo_sort_dfs(graph):
    visited ← {}
    result ← []

    for each node in graph:
        if node not in visited:
            dfs(graph, node, visited, result)

    return reverse(result)

dfs(graph, node, visited, result):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited, result)
    result.append(node)  ← post-order
```

Why does this work? A node is appended **after** all nodes it can reach. So if $u \to v$, then $v$ finishes before $u$, and $u$ appears before $v$ in the reversed result.

## Kahn's algorithm (BFS-based)

Kahn's takes a different angle: start with nodes that have **no incoming edges** (in-degree 0), process them, remove their outgoing edges, and repeat. If new nodes now have in-degree 0, add them to the queue.

```
kahn(graph):
    in_degree ← compute in-degrees for all nodes
    queue ← [nodes with in_degree == 0]
    result ← []

    while queue is not empty:
        node ← queue.dequeue()
        result.append(node)

        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.enqueue(neighbor)

    if result.length != total_nodes:
        error "Graph has a cycle"
    return result
```

Kahn's has a nice bonus: if the result is shorter than the total number of nodes, you know the graph has a cycle. The DFS approach can detect cycles with the three-color technique (see DFS page).

## DFS vs Kahn's

| | DFS-based | Kahn's (BFS-based) |
|---|---|---|
| Core idea | Reverse post-order | Peel off zero-in-degree nodes |
| Cycle detection | Three-color scheme | Result length < node count |
| Implementation | Recursive, compact | Iterative, uses in-degree array |
| Determinism | Depends on neighbor order | Depends on queue processing order |

Both are $O(V + E)$. Kahn's is often preferred in practice because it's iterative (no stack overflow risk) and the cycle detection is trivial.

## Use cases

**Build systems.** Make, Bazel, Gradle — all resolve task dependencies with topological sort. Compile file A before B if B imports A.

**Course prerequisites.** Given a list of courses and prerequisites, find a valid order to take them. This is literally topological sort on the prerequisite graph.

**Package managers.** npm, pip, cargo — install dependencies in the right order.

**Spreadsheet evaluation.** Cell B1 depends on A1 and A2. Topological sort determines the evaluation order so every cell's dependencies are computed before the cell itself.

**Data pipeline scheduling.** ETL jobs where step 3 depends on steps 1 and 2.

## Longest path in a DAG

You can find the longest path in a DAG (impossible in general graphs — that's NP-hard) by processing nodes in topological order and relaxing edges with max instead of min:

```
for node in topological_order:
    for (neighbor, weight) in graph[node]:
        if dist[node] + weight > dist[neighbor]:
            dist[neighbor] = dist[node] + weight
```

This is used in critical path analysis (project scheduling) and some DP problems.

## Complexity

| | Time | Space |
|---|---|---|
| DFS-based | $O(V + E)$ | $O(V)$ |
| Kahn's | $O(V + E)$ | $O(V)$ |

## Key takeaways

- **Topological sort only works on DAGs** — a valid ordering exists if and only if the graph has no cycles.
- **Kahn's algorithm is usually the safer interview choice** — it's iterative (no stack overflow), and cycle detection is trivial (result length < node count).
- **DFS-based approach uses reverse post-order** — a node is appended after all reachable nodes are processed, then the result is reversed.
- **Multiple valid orderings can exist** — any two nodes without a directed path between them can appear in either order.
- **Think "dependency resolution"** — whenever a problem involves prerequisites, ordering constraints, or scheduling, consider topological sort.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Course Schedule](https://leetcode.com/problems/course-schedule/) | 🟡 Medium | Detect if a valid topological ordering exists (cycle detection) |
| [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | 🟡 Medium | Return an actual topological ordering using Kahn's or DFS |
| [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) | 🔴 Hard | Build a graph from character ordering constraints, then topo-sort |
| [Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees/) | 🟡 Medium | Peel leaves iteratively (Kahn's-like approach on undirected graph) |
| [Sequence Reconstruction](https://leetcode.com/problems/sequence-reconstruction/) | 🟡 Medium | Check if a unique topological order exists from subsequences |

## Relation to other topics

- **DFS** — the DFS-based topological sort is a direct application of post-order traversal; cycle detection uses the three-color DFS technique.
- **Shortest/longest path in a DAG** — processing nodes in topological order allows single-pass relaxation, replacing Dijkstra for DAGs.
- **Dynamic programming on DAGs** — many DP problems on graphs reduce to computing values in topological order, since each node's answer depends only on already-computed successors.
