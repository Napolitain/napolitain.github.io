---
title: "B-Tree"
description: "Store many keys per node so search trees stay shallow and disk/page reads stay low. B-Trees are the classic external-memory search structure."
date: 2026-03-07
tags: ["b-tree", "database", "index", "search"]
draft: false
visualization: "BTreeVisualization"
family: "systems"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["binary-search", "tree-fundamentals"]
related: ["binary-search-tree", "b-plus-tree", "external-merge-sort"]
enables: ["b-plus-tree"]
---

## Problem

A binary search tree is conceptually clean, but it is a bad fit for storage systems where the expensive part is **page reads**, not comparisons.

If every node visit means touching another disk page, then a tall binary tree is painful.

## Core idea

A B-Tree stores **many keys per node** instead of just one.

Each node covers a whole key range and can have many children, so the fanout is large.

That means the height drops from something like binary branching to something closer to:

$$
O(\log_B n)
$$

where `B` is the branching factor determined by how many keys fit in a page.

## Why it matters

B-Trees are the canonical answer to this systems question:

> how do I turn ordered search into as few page reads as possible?

They are the conceptual bridge from in-memory ordered trees to database indexes and filesystems.

## Structural rules

Different texts vary on the exact minimum degree notation, but the key properties are:

- keys inside a node are sorted
- child subtrees split the key ranges between those keys
- all leaves live at the same depth
- nodes stay at least partially full, except sometimes the root

These rules keep the tree balanced while preserving high fanout.

## Operations

### Search
Search inside the current node, then descend to the appropriate child range.

### Insert
Insert into a leaf. If a node overflows, split it and promote a separator upward.

### Delete
Delete while preserving occupancy rules, often by borrowing from siblings or merging nodes.

The mechanics are more involved than a BST, but the payoff is page efficiency.

## Complexity

| Operation | Time |
|---|---|
| Search | $O(\log_B n)$ page levels |
| Insert | $O(\log_B n)$ |
| Delete | $O(\log_B n)$ |

## Key takeaways

- B-Trees are about minimizing **I/O depth**, not just comparison count
- High fanout is the crucial design idea
- Splits and merges preserve balance while keeping nodes page-sized
- This is one of the most important database-flavored data structures in the atlas

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [B-Tree overview](https://en.wikipedia.org/wiki/B-tree) | 🔴 Hard | Page-sized balanced search tree |
| [Database indexing references](https://www.postgresql.org/docs/current/btree.html) | 🔴 Hard | Ordered indexes in real systems |
| [CLRS B-Tree chapter references](https://walkccc.me/CLRS/Chap18/18.1/) | 🔴 Hard | Splits, merges, and minimum degree |

## Relation to other topics

- **Binary Search** explains why ordered separators are enough to route a search
- **Binary Search Tree** is the narrow-fanout in-memory ancestor of the same ordered-search idea
- **B+ Tree** is the database-optimized variant most engines prefer in practice
- **External Merge Sort** often appears nearby because both topics are about respecting page and disk costs
