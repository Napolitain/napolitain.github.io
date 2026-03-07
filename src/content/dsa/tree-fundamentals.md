---
title: "Tree Fundamentals"
description: "Understand roots, parents, children, depth, height, and traversal orders. A tree is a graph with enough structure to make many problems much simpler."
date: 2026-03-06
tags: ["tree", "graphs", "bfs", "dfs", "recursion"]
draft: false
visualization: "TreeFundamentalsVisualization"
family: "tree"
kind: "concept"
difficulty: "intro"
prerequisites: ["graph-fundamentals"]
related: ["bfs-breadth-first-search", "dfs-depth-first-search", "binary-search-tree", "heap", "trie", "segment-tree", "backtracking", "fenwick-tree", "euler-tour-technique", "binary-lifting", "treap"]
enables: ["binary-search-tree", "heap", "trie", "segment-tree", "backtracking", "fenwick-tree", "euler-tour-technique", "binary-lifting", "treap"]
---

## Problem

Many structures and recursive problems are not arbitrary graphs - they are **hierarchies**. You have a root, smaller subproblems below it, and no cycles tying the structure into knots.

That is the world of trees.

## Intuition

A tree is a graph with exactly the constraints you want for hierarchical reasoning:

- it is **connected**
- it has **no cycles**

Those two facts buy you a lot:

- there is exactly **one simple path** between any two nodes
- every node except the root has exactly **one parent**
- each node owns a clean **subtree** that can be solved recursively

This is why trees feel friendlier than general graphs. The structure removes a huge class of edge cases.

## Core vocabulary

- **Root**: the chosen starting node
- **Parent / child**: direction induced by rooting the tree
- **Leaf**: a node with no children
- **Depth**: distance from the root
- **Height**: longest downward path to a leaf
- **Subtree**: a node plus everything below it

Once you see a subtree, you should immediately think: *this problem might be recursive.*

## Structural facts worth memorizing

For a tree with $n$ nodes:

- it has exactly **$n - 1$ edges**
- removing any edge splits it into **two components**
- adding any extra edge creates **exactly one cycle**

These are not trivia. They are often the shortest route to a proof or to a linear-time solution.

## Traversal orders

### DFS traversals

DFS on a tree gives the classic recursive orders:

- **Pre-order**: process node before children
- **In-order**: process between children (binary trees only)
- **Post-order**: process after children

Post-order is especially important because it lets children compute answers before the parent combines them.

### BFS traversal

BFS on a tree is **level-order traversal**.

That is how you:

- process the tree level by level
- find minimum depth
- connect siblings or cousins
- serialize by layers

## Why trees are easier than graphs

In a rooted tree, you usually do **not** need a visited set. If you only move from parent to children, the structure itself prevents revisits.

Compare that to a general graph where cycles force you to track visited nodes explicitly.

This is the practical meaning of "tree = special case of graph": many graph algorithms simplify because the shape is stricter.

## Common patterns

### Subtree aggregation

Ask each subtree for an answer, then combine.

Examples:

- subtree size
- height / diameter
- sum of values
- balanced-tree checks

### Choose-before / choose-after

Many tree DP problems come down to whether the current node's answer depends on:

- the answer **before** visiting children
- the answer **after** visiting children

That is just another way of asking which traversal order you need.

### Implicit trees

Backtracking problems often build an **implicit** tree of decisions:

- pick / skip
- place / remove
- continue / prune

Even when there is no tree in memory, the search space behaves like one.

## Complexity

| Task | Time | Space |
|---|---|---|
| DFS traversal | $O(n)$ | $O(h)$ recursion stack |
| BFS traversal | $O(n)$ | $O(w)$ queue, where $w$ is max width |
| Visit every node once | $O(n)$ | depends on traversal |

Here $h$ is the height of the tree. Balanced trees have $h = O(\log n)$; chains have $h = O(n)$.

## Key takeaways

- A **tree is a connected acyclic graph**, which gives you unique paths and clean parent/child structure
- **Subtrees are self-contained subproblems**, so recursive reasoning is the default mental model
- **DFS** is best when you need subtree answers; **BFS** is best when you need level-by-level structure
- Many graph headaches disappear on trees because the structure prevents cycles and repeated visits
- BSTs, heaps, tries, and segment trees are all specialized trees that add one more invariant on top of the basic tree shape

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | 🟢 Easy | Tree height is the simplest subtree aggregation |
| [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | 🟡 Medium | BFS on a tree is level-order traversal |
| [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | 🟡 Medium | Combine subtree heights bottom-up |
| [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | 🟢 Easy | Post-order traversal with early failure |
| [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | 🟡 Medium | Recursively merge information from left and right subtrees |

## Relation to other topics

- **Graph fundamentals** is the broader theory; trees are graphs with extra guarantees
- **BFS** and **DFS** become tree traversals when the graph has no cycles
- **Binary search tree**, **heap**, **trie**, and **segment tree** each add a different invariant on top of the tree shape
- **Backtracking** explores an implicit tree of decisions, even when the original problem is not presented as one
