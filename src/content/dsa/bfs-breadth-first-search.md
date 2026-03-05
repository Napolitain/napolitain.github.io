---
title: "BFS — Breadth-First Search"
description: "Explore a graph level by level using a queue. BFS finds the shortest path in unweighted graphs and is fundamental to many graph algorithms."
date: 2026-03-05
tags: ["graphs", "bfs", "shortest-path", "queue"]
draft: false
visualization: "BfsVisualization"
---

## Problem

Given a graph and a starting node, visit every reachable node in **breadth-first order** — processing all neighbors of the current node before moving deeper.

## Intuition

BFS uses a **queue** (FIFO). You push the start node, then repeatedly dequeue a node, mark it visited, and enqueue all its unvisited neighbors. Because you process nodes in the order they were discovered, you naturally visit them **level by level**.

This is the key insight: nodes at distance 1 from the start are all processed before nodes at distance 2, which are all processed before distance 3, and so on. The queue enforces this ordering for free.

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

### Do you always need a visited set?

**On general graphs — yes.** Without it, cycles cause infinite loops. If node A connects to B and B connects back to A, you'd enqueue A again after visiting B, and the algorithm never terminates.

**On trees — no.** A tree is acyclic by definition. If you're doing BFS on a rooted tree and only visit children (not the parent), there's no cycle to worry about. You can skip the visited set entirely. This is why level-order traversal of a binary tree doesn't need one — you just enqueue left and right children.

**On DAGs — it depends.** A DAG has no cycles, so you won't loop forever. But without a visited set, you might process the same node multiple times if it has multiple parents (in-degree > 1). Whether that matters depends on your use case. If you're counting shortest distances, duplicate processing gives wrong results. If you just need to "see" every node, it's wasteful but not incorrect.

## BFS for shortest path

BFS guarantees the **shortest path** in terms of edge count for unweighted graphs. The first time you reach a node is always via the minimum number of edges. This is because the queue processes all nodes at distance $d$ before any node at distance $d+1$.

This breaks when edges have weights. If edge A→B has weight 1 and edge A→C has weight 100, BFS doesn't know that — it treats both as "one hop." For weighted shortest paths, you need **Dijkstra's algorithm**, which replaces the queue with a priority queue sorted by cumulative distance.

## Level-order traversal

On a tree, BFS produces a **level-order traversal**: root first, then all depth-1 nodes, then all depth-2 nodes, etc. This is exactly what you'd want for:

- Printing a tree level by level
- Finding the minimum depth of a tree
- Connecting nodes at the same level (e.g., "next right pointer" problems)

A common trick is to track the level boundary by recording `queue.length` at the start of each iteration:

```
level_order(root):
    queue ← [root]
    while queue is not empty:
        level_size ← queue.length
        for i in 0..level_size:
            node ← queue.dequeue()
            process(node)
            enqueue children of node
```

## When to use BFS vs DFS

| Use BFS when... | Use DFS when... |
|---|---|
| You need the shortest path (unweighted) | You need to explore all paths |
| You want level-order processing | You need topological ordering |
| The solution is close to the root | The solution is deep in the graph |
| You want to find connected components layer by layer | You need to detect cycles (back edges) |

BFS uses $O(V)$ memory for the queue. DFS uses $O(V)$ for the stack. In practice, BFS tends to use more memory on wide graphs (many neighbors), while DFS uses more on deep graphs (long chains).

## Complexity

| | Time | Space |
|---|---|---|
| BFS | $O(V + E)$ | $O(V)$ |

Where $V$ is the number of vertices and $E$ is the number of edges. Every vertex is enqueued and dequeued exactly once. Every edge is examined once (twice in undirected graphs, once per endpoint).

## Relation to other algorithms

- **Dijkstra** is BFS with a priority queue — instead of processing nodes in discovery order, it processes them in order of cumulative edge weight. When all weights are 1, Dijkstra degenerates to BFS.
- **0-1 BFS** handles graphs with edge weights of 0 or 1 using a deque instead of a priority queue — push weight-0 neighbors to the front, weight-1 neighbors to the back.
- **Bidirectional BFS** runs two BFS instances simultaneously from the start and end, meeting in the middle. This reduces the search space from $O(b^d)$ to $O(b^{d/2})$ where $b$ is the branching factor and $d$ is the distance.
