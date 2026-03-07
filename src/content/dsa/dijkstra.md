---
title: "Dijkstra's Algorithm"
description: "Find the shortest path in weighted graphs with non-negative edges. Dijkstra is BFS with a priority queue — it processes nodes in order of cumulative distance."
date: 2026-03-05
tags: ["graphs", "shortest-path", "greedy", "priority-queue"]
draft: false
visualization: "DijkstraVisualization"
family: "graph"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["graph-fundamentals", "bfs-breadth-first-search", "heap", "greedy"]
related: ["minimum-spanning-tree", "heap", "zero-one-bfs"]
enables: []
---

## Problem

Given a weighted graph with **non-negative** edge weights and a starting node, find the shortest distance from the start to every other node.

## Intuition

BFS finds shortest paths when all edges have the same weight. Dijkstra generalizes this to arbitrary non-negative weights by replacing the queue with a **priority queue** (min-heap) sorted by cumulative distance.

At each step, you extract the node with the smallest known distance, then try to **relax** its neighbors — if the path through the current node offers a shorter distance than what's currently recorded, update it.

The greedy choice works because all edge weights are non-negative: once a node is extracted from the priority queue, no future path can possibly reach it with a lower distance. You've already found the shortest path to that node.

## Algorithm

```
Dijkstra(graph, start):
    dist ← {start: 0}  // all others: ∞
    pq ← MinHeap([(0, start)])
    visited ← {}

    while pq is not empty:
        (d, node) ← pq.extract_min()
        if node in visited:
            continue
        visited.add(node)

        for (neighbor, weight) in graph[node]:
            new_dist ← d + weight
            if new_dist < dist.get(neighbor, ∞):
                dist[neighbor] ← new_dist
                pq.insert((new_dist, neighbor))
```

### Relaxation

The core operation is **relaxation**: for edge $(u, v)$ with weight $w$:

```
if dist[u] + w < dist[v]:
    dist[v] = dist[u] + w
```

This is asking: "Is the path to $v$ through $u$ shorter than the best known path to $v$?" If yes, update. This is the same operation used in Bellman-Ford, but Dijkstra applies it in a specific order (nearest node first) that guarantees correctness with fewer operations.

## Why non-negative weights?

Dijkstra's greedy assumption is: "once I extract a node from the priority queue, its distance is final." Negative edges break this. Consider:

```
A --1--> B --(-5)--> C
A --3--> C
```

Dijkstra processes B first (distance 1), then C via A→C (distance 3). But the actual shortest path is A→B→C (distance -4). After finalizing C at distance 3, Dijkstra never reconsiders it.

For graphs with negative edges (but no negative cycles), use **Bellman-Ford** instead. It runs relaxation $V-1$ times over all edges, which handles negative weights correctly at the cost of $O(VE)$ time.

## Implementation details

### Priority queue behavior

Most languages don't have a decrease-key operation that's easy to use. The standard trick is **lazy deletion**: insert a new entry into the heap with the updated distance, and skip stale entries when you extract them (that's the `if node in visited: continue` check).

This means the heap can grow up to $O(E)$ entries instead of $O(V)$, but in practice it works well and is simpler than implementing a Fibonacci heap.

### Reconstructing the path

To recover the actual shortest path (not just the distance), maintain a `prev` map:

```
if new_dist < dist[neighbor]:
    dist[neighbor] = new_dist
    prev[neighbor] = node
```

Then walk backward from the target: `target → prev[target] → prev[prev[target]] → ... → start`.

## When to use what

| Problem | Algorithm | Why |
|---|---|---|
| Unweighted shortest path | BFS | All edges weight 1 — a queue suffices |
| Non-negative weights | Dijkstra | Greedy on nearest node works |
| Negative weights, no negative cycles | Bellman-Ford | Relaxes all edges $V-1$ times |
| Negative cycles detection | Bellman-Ford | Run $V$-th iteration to detect |
| All-pairs shortest path | Floyd-Warshall | $O(V^3)$ DP over intermediate nodes |
| Sparse graph, single-source | Dijkstra | $O((V+E) \log V)$ beats Floyd-Warshall |

## Complexity

| Variant | Time | Space |
|---|---|---|
| Binary heap | $O((V + E) \log V)$ | $O(V + E)$ |
| Fibonacci heap | $O(V \log V + E)$ | $O(V + E)$ |
| Array (no heap) | $O(V^2)$ | $O(V)$ |

The binary heap version is the most practical. The array version is better for dense graphs ($E \approx V^2$) because the $\log V$ factor on $E$ insertions hurts more than the $V^2$ scan.

## Key takeaways

- **Dijkstra is BFS with a priority queue** — it processes nodes in order of cumulative distance instead of discovery order.
- **The greedy choice is safe because weights are non-negative** — once a node is extracted from the heap, its shortest distance is finalized.
- **Use lazy deletion** instead of decrease-key — insert duplicates into the heap and skip stale entries with a visited check.
- **Switch to Bellman-Ford for negative weights** — Dijkstra's greedy assumption breaks when edges can reduce the total distance after a node is finalized.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | 🟡 Medium | Classic single-source Dijkstra — find the max of all shortest distances |
| [Path with Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/) | 🟡 Medium | Dijkstra on a grid where edge weight is the absolute height difference |
| [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | 🟡 Medium | Modified Dijkstra with a stop constraint — track (cost, stops) in the heap |
| [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/) | 🔴 Hard | Dijkstra where the cost is the max cell value along the path |
| [Minimum Cost to Make at Least One Valid Path](https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/) | 🔴 Hard | 0-1 BFS on a grid — free moves along arrows, cost-1 moves otherwise |

## Relation to other topics

- **0-1 BFS** handles the special case where edge weights are only 0 or 1 using a deque instead of a heap — push weight-0 neighbors to the front, weight-1 neighbors to the back. This gives $O(V + E)$ time without the $\log V$ heap overhead. It comes up in grid problems where some moves are "free."
- **Bellman-Ford** handles negative edge weights by relaxing all edges $V-1$ times, at the cost of $O(VE)$ time. Use it when Dijkstra's non-negative weight assumption doesn't hold.
- **A\*** extends Dijkstra with a heuristic that estimates remaining distance, directing the search toward the goal and reducing explored nodes.
