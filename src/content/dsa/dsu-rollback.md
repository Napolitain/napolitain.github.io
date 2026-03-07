---
title: "DSU Rollback"
description: "Add an undo stack to Union-Find so merges can be reversed during offline divide-and-conquer or time-travel style processing."
date: 2026-03-07
tags: ["union-find", "rollback", "rare"]
draft: false
visualization: "DsuRollbackVisualization"
family: "graph"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["union-find"]
related: ["mos-algorithm", "persistent-segment-tree", "tarjan-scc"]
enables: []
---

## Problem

Ordinary Union-Find is great at merging components, but it cannot undo merges efficiently.

Some offline connectivity problems need exactly that ability.

## Core idea

Whenever a union actually changes the structure, push enough information onto a stack to restore the previous parents and sizes later.

Then `rollback()` simply pops and restores that state.

## Why it matters

DSU rollback is the standard bridge from static connectivity to offline dynamic connectivity.

It often appears with:

- divide and conquer on time
- segment trees over active time intervals
- batch add/remove edge processing

## Complexity

| Operation | Time |
|---|---|
| Union | amortized near-constant without full path compression |
| Rollback | $O(1)$ per undone merge |

Implementations usually avoid aggressive path compression because it is hard to undo cleanly.

## Key takeaways

- DSU rollback is Union-Find plus an undo log
- The main sacrifice is that you cannot rely on ordinary destructive path compression
- This is rare advanced graph/offline material, but it unlocks whole classes of dynamic connectivity problems
- It is conceptually related to persistence, but implemented as reversible mutation rather than structural sharing

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Dynamic Connectivity Offline references](https://cp-algorithms.com/data_structures/deleting_in_log_n.html) | 🔴 Hard | Segment tree on time plus rollback DSU |
| [Connect and Disconnect references](https://usaco.guide/adv/offline-del) | 🔴 Hard | Undoable unions over time |
| [Rollback DSU tutorials](https://codeforces.com/blog/entry/45223) | 🔴 Hard | Stack-based reversion |

## Relation to other topics

- **Union-Find** is the base structure that rollback extends
- **Mo's Algorithm** is another offline reordering technique where online answers are replaced by clever scheduling
- **Persistent Segment Tree** offers a different history-preserving style through structural sharing instead of explicit rollback
