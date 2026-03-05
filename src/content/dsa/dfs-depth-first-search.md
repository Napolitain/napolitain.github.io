---
title: "DFS — Depth-First Search"
description: "Dive as deep as possible before backtracking. DFS is essential for detecting cycles, topological sorting, and exploring all paths in a graph."
date: 2026-03-05
tags: ["graphs", "dfs", "tree", "recursion", "stack"]
draft: false
visualization: "DfsVisualization"
---

## Problem

Given a graph and a starting node, explore as **deep** as possible along each branch before backtracking.

## Intuition

DFS uses a **stack** (explicitly or via recursion). You push the start node, then repeatedly pop a node, mark it visited, and push all its unvisited neighbors. Because stacks are LIFO, you always follow the most recently discovered path first — going deep before going wide.

This is the opposite of BFS. Where BFS fans out evenly like a ripple, DFS dives down a single path until it hits a dead end, then backtracks. This behavior makes it natural for problems that require exhaustive exploration: "try every possibility, undo, try the next."

## Algorithm

### Iterative (explicit stack)

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

### Recursive

```
DFS(graph, node, visited):
    visited.add(node)
    process(node)

    for neighbor in graph[node]:
        if neighbor not in visited:
            DFS(graph, neighbor, visited)
```

The recursive version is cleaner and maps directly to the call stack. Each recursive call pushes a frame onto the call stack, which acts as the implicit stack. The downside: deep graphs can blow the call stack. Python's default limit is 1000 frames. C/C++ varies by OS but is typically a few thousand to a few million depending on frame size.

## Do you always need a visited set?

**On general graphs — yes.** Cycles will cause infinite recursion or an infinite loop without one. The visited set is what prevents re-entering a node you've already processed.

**On trees — no.** A tree has exactly one path between any two nodes. If you're traversing a rooted tree and only recurse into children (not the parent), you can't revisit a node. This is why binary tree traversals (pre-order, in-order, post-order) never use a visited set — the tree structure itself prevents cycles.

**On DAGs — it depends.** Similar to BFS: no infinite loops, but you may process a node multiple times via different paths. For topological sort, you do need to track visited nodes to avoid re-processing and to correctly identify the finish order.

## Tree traversal orders

When DFS is applied to a tree, the order in which you **process** the node relative to its children gives you three classic traversal orders:

### Pre-order (process **before** children)

```
pre_order(node):
    if node is null: return
    process(node)          ← before children
    pre_order(node.left)
    pre_order(node.right)
```

Visit order on a tree `[1, [2, [4], [5]], [3, [6]]]`: **1, 2, 4, 5, 3, 6**

Use cases: copying a tree, serializing a tree (the output can reconstruct the tree if you also know the structure), prefix expression evaluation.

### In-order (process **between** children)

```
in_order(node):
    if node is null: return
    in_order(node.left)
    process(node)          ← between children
    in_order(node.right)
```

Visit order on a BST `[4, [2, [1], [3]], [6, [5]]]`: **1, 2, 3, 4, 5, 6**

This is special: on a **binary search tree**, in-order traversal visits nodes in **sorted order**. This is because every left subtree contains smaller values and every right subtree contains larger values. In-order walks them left → root → right, which is ascending.

Use cases: BST validation, finding the k-th smallest element, converting BST to sorted array.

### Post-order (process **after** children)

```
post_order(node):
    if node is null: return
    post_order(node.left)
    post_order(node.right)
    process(node)          ← after children
```

Visit order on tree `[1, [2, [4], [5]], [3, [6]]]`: **4, 5, 2, 6, 3, 1**

Use cases: deleting a tree (delete children before parent), evaluating expression trees (compute subtrees first), calculating directory sizes (need child sizes before parent).

### Summary

| Order | When node is processed | Typical use |
|---|---|---|
| Pre-order | Before children | Serialize, copy |
| In-order | Between children | BST sorted output |
| Post-order | After children | Delete, evaluate |

All three are $O(n)$ time and $O(h)$ space where $h$ is the tree height.

## Cycle detection with DFS

DFS can detect cycles using a three-color scheme:

- **White**: undiscovered
- **Gray**: currently being explored (on the recursion stack)
- **Black**: fully explored (all descendants finished)

If you encounter a **gray** node during DFS, you've found a **back edge** — which means a cycle exists. Gray means "I'm still exploring this node's descendants, and I've circled back to it."

```
has_cycle(graph, node, color):
    color[node] ← GRAY

    for neighbor in graph[node]:
        if color[neighbor] == GRAY:
            return true              ← cycle found
        if color[neighbor] == WHITE:
            if has_cycle(graph, neighbor, color):
                return true

    color[node] ← BLACK
    return false
```

This three-color approach is specifically for **directed** graphs. For undirected graphs, cycle detection is simpler: if you encounter a visited node that isn't your parent, there's a cycle. Or use Union-Find.

## Complexity

| | Time | Space |
|---|---|---|
| DFS | $O(V + E)$ | $O(V)$ |

Every vertex is visited exactly once. Every edge is examined once (twice in undirected graphs). Space is $O(V)$ for the visited set plus the stack depth, which is $O(V)$ in the worst case (a long chain) but $O(\log V)$ for balanced trees.

## Relation to other algorithms

- **Topological sort** is DFS where you append each node to the result **after** all its descendants are finished (post-order on the DFS tree), then reverse. Alternatively, Kahn's algorithm does this with BFS.
- **Strongly Connected Components** (Tarjan's, Kosaraju's) rely on DFS finish times to decompose a directed graph.
- **Backtracking** is DFS on the implicit search tree of all possible states — prune branches that can't lead to a solution.
