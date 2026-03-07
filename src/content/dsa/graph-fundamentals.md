---
title: "Graph Fundamentals"
description: "Learn the core language of nodes, edges, paths, and cycles. Graphs are the broad container that trees, BFS, DFS, Dijkstra, and MST all live inside."
date: 2026-03-06
tags: ["graphs", "graph-theory", "traversal", "connected-components"]
draft: false
visualization: "GraphFundamentalsVisualization"
family: "graph"
kind: "concept"
difficulty: "intro"
prerequisites: []
related: ["tree-fundamentals", "bfs-breadth-first-search", "dfs-depth-first-search", "zero-one-bfs"]
enables: ["tree-fundamentals", "bfs-breadth-first-search", "dfs-depth-first-search", "topological-sort", "zero-one-bfs", "dijkstra", "minimum-spanning-tree", "union-find"]
---

## Problem

Many problems are really about **relationships** rather than individual values: cities connected by roads, users linked by friendships, courses linked by prerequisites, files linked by dependencies.

You need a model that captures **things** and the **connections** between them. That model is a graph.

## Intuition

A graph has:

- **Vertices / nodes**: the things
- **Edges**: the relationships between them

That's it. Everything else is a refinement:

- **Directed** vs **undirected** edges
- **Weighted** vs **unweighted** edges
- **Cyclic** vs **acyclic** structure
- **Connected** vs **disconnected** components

This is why graph thinking is so broad: once a problem becomes "objects + links", graph algorithms become available.

## Core vocabulary

### Path

A **path** is a sequence of edges connecting one node to another.

```
A -> C -> F
```

Once you can talk about paths, you can ask the big questions:

- Is a node reachable?
- What is the shortest path?
- Does a path respect dependencies?

### Cycle

A **cycle** is a path that returns to where it started.

```
A -> B -> E -> C -> A
```

Cycles matter because they force you to track visited state and often make problems harder.

### Connected component

A **connected component** is a maximal set of nodes where every node can reach every other node.

In an undirected graph, components answer: "how many separate islands are there?"

### Degree

The **degree** of a node is how many edges touch it.

In directed graphs, this splits into:

- **in-degree**: edges coming in
- **out-degree**: edges going out

In-degree is the key idea behind Kahn's algorithm for topological sort.

## Representation

### Adjacency list

```
A: [B, C]
B: [A, D, E]
C: [A, E, F]
```

Best when the graph is **sparse**. Most interview graphs are sparse, so adjacency lists are the default representation.

### Adjacency matrix

```
    A B C D
A [ 0 1 1 0 ]
B [ 1 0 0 1 ]
C [ 1 0 0 0 ]
D [ 0 1 0 0 ]
```

Best when the graph is **dense** or when you need constant-time edge existence checks. But it costs $O(V^2)$ space.

## Traversal is the universal primitive

Two traversals dominate graph problems:

- **BFS** explores level by level and gives shortest paths in unweighted graphs
- **DFS** dives deep, making it ideal for cycle detection, topological ordering, and exhaustive search

Once you understand graphs, BFS and DFS feel like two different ways of asking the same question: *how do I systematically explore connectivity?*

## Trees are special graphs

A **tree** is a graph with stronger guarantees:

- connected
- acyclic
- exactly $n - 1$ edges for $n$ nodes
- exactly one simple path between any two nodes

That one sentence is worth remembering:

> A tree is a special case of a graph.

This is why so many tree techniques are really graph techniques with fewer edge cases. BFS and DFS still work. Shortest paths become trivial because there is only one path. Visited sets often disappear because the structure itself prevents revisits.

## Common graph shapes

### DAG (Directed Acyclic Graph)

A DAG is a directed graph with no cycles.

Use it for:

- build systems
- course schedules
- dependency resolution

DAGs unlock **topological sort**.

### Weighted graph

Edges carry costs:

```
A --5--> B
A --2--> C
```

Once weights matter, plain BFS is no longer enough. You move to **Dijkstra** (or Bellman-Ford / Floyd-Warshall depending on the setting).

## Complexity

With an adjacency list:

| Operation | Time |
|---|---|
| Store the graph | $O(V + E)$ |
| BFS | $O(V + E)$ |
| DFS | $O(V + E)$ |
| Check one specific edge | $O(\deg(v))$ |

With an adjacency matrix:

| Operation | Time |
|---|---|
| Store the graph | $O(V^2)$ |
| BFS / DFS | $O(V^2)$ |
| Check one specific edge | $O(1)$ |

## Key takeaways

- A **graph** is the general model for connected things; trees, DAGs, and weighted networks are all more specialized graph shapes
- **Paths, cycles, and connected components** are the first three structural questions to ask when reading a graph problem
- **Adjacency lists** are the default representation for sparse graphs and almost always the right interview choice
- **BFS and DFS** are the two universal graph traversals; most graph algorithms are built on top of them
- A **tree is just a connected acyclic graph**, which is why graph intuition transfers directly into tree problems

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/) | 🟢 Easy | Reachability is the most basic graph question |
| [Number of Connected Components in an Undirected Graph](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | 🟡 Medium | Traverse each unseen component once |
| [Is Graph Bipartite?](https://leetcode.com/problems/is-graph-bipartite/) | 🟡 Medium | BFS/DFS coloring on a general graph |
| [Course Schedule](https://leetcode.com/problems/course-schedule/) | 🟡 Medium | DAG reasoning and cycle detection |
| [Clone Graph](https://leetcode.com/problems/clone-graph/) | 🟡 Medium | Traverse while preserving structure |

## Relation to other topics

- **Tree fundamentals** adds stronger guarantees on top of a graph: no cycles, full connectivity, unique simple paths
- **BFS** and **DFS** are the two core traversals every graph problem is built from
- **Topological sort** is what happens when the graph is directed and acyclic
- **Dijkstra** adds weights to shortest-path reasoning
- **Minimum spanning tree** and **Union-Find** are about connectivity and edge selection under graph constraints
