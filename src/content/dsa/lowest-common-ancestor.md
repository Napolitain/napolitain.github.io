---
title: "Lowest Common Ancestor"
description: "Find the deepest shared ancestor of two nodes in a rooted tree. LCA is a core tree-query problem that ties together DFS, binary lifting, and Euler tours."
date: 2026-03-07
tags: ["tree", "lca", "queries", "binary-lifting"]
draft: false
visualization: "LowestCommonAncestorVisualization"
family: "tree"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["tree-fundamentals", "dfs-depth-first-search"]
related: ["binary-lifting", "euler-tour-technique", "sparse-table"]
enables: []
---

## Problem

Given two nodes in a rooted tree, find the deepest node that is an ancestor of both.

That node is their **lowest common ancestor** (LCA).

This query appears everywhere:

- distance between two tree nodes
- path queries
- subtree reasoning
- comparing ancestry relationships

## Why it matters

LCA is one of the big “tree queries” that turns a plain rooted tree into a query-processing structure.

It also acts as a meeting point for several other topics:

- **DFS** provides depth and parent information
- **Binary lifting** gives one common $O(\log n)$ solution
- **Euler tour + sparse table** gives another classic route

So LCA is not isolated. It sits exactly where the tree-query toolkit comes together.

## Core idea

A node is a common ancestor if both query nodes lie in its subtree chain to the root.

The **lowest** common ancestor is simply the deepest such node.

A slow solution walks both nodes upward until they meet. A fast solution preprocesses the tree.

## Binary lifting route

1. preprocess depth and parent jumps
2. lift the deeper node until both nodes have the same depth
3. lift both nodes together from large jumps to small jumps
4. the parent where they first agree is the LCA

This gives:

- preprocessing: $O(n \log n)$
- query: $O(\log n)$

## Euler tour + RMQ route

Another classic method:

1. run an Euler tour of the tree
2. record depths along the tour
3. the LCA of two nodes becomes a range minimum query over first occurrences

This is why LCA often appears right after Euler tour and sparse table material.

## Complexity

| Method | Preprocess | Query |
|---|---|---|
| Naive parent climbing | $O(1)$ | $O(n)$ |
| Binary lifting | $O(n \log n)$ | $O(\log n)$ |
| Euler tour + RMQ | $O(n \log n)$ | $O(1)$ or $O(\log n)$ depending on RMQ structure |

## Key takeaways

- LCA is a core rooted-tree query, not a niche trick
- It ties together depth, parent pointers, DFS order, and range-query ideas
- Binary lifting is usually the most practical general solution
- Euler tour + RMQ is the more reduction-style view of the same problem

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | 🟡 Medium | Basic recursive LCA reasoning |
| [Company Queries II](https://cses.fi/problemset/task/1688/) | 🔴 Hard | Fast LCA queries in rooted trees |
| [Distance Queries](https://cses.fi/problemset/task/1135/) | 🔴 Hard | LCA plus depth arithmetic |

## Relation to other topics

- **Binary lifting** is the most common fast LCA implementation in this atlas
- **Euler tour technique** can reduce LCA to a range minimum query
- **Sparse table** is often the RMQ structure used after Euler tour preprocessing
