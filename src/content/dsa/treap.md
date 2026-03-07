---
title: "Treap"
description: "Combine binary-search-tree ordering with heap priorities to get a balanced randomized tree with elegant split and merge operations."
date: 2026-03-07
tags: ["tree", "bst", "randomized", "rare"]
draft: false
visualization: "TreapVisualization"
family: "tree"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["tree-fundamentals", "binary-search-tree", "heap"]
related: ["segment-tree", "fenwick-tree", "binary-lifting"]
enables: []
---

## Problem

A plain binary search tree is elegant, but it can become skewed and degrade to $O(n)$ per operation.

Balanced BSTs fix that, but many of them are implementation-heavy. A treap gets balance in a much simpler way: add randomness.

## What a treap is

A treap is simultaneously:

- a **binary search tree by key**
- a **heap by random priority**

Each node stores:

- `key`
- `priority`

The inorder traversal is sorted by key. The priorities satisfy heap order.

That dual constraint is what keeps the tree balanced in expectation.

## Why it works

Imagine inserting keys into a BST in the order of decreasing priority. You would get exactly the same tree shape as the treap.

Because priorities are random, the expected height stays logarithmic.

So a treap is basically a randomized balanced BST.

## Rotations or split/merge

Treaps are often implemented in one of two styles:

### Rotation style
Insert like a BST, then rotate upward while the heap priority is violated.

### Split/merge style
Use two beautiful primitives:

- `split(root, key)` separates keys `< key` from keys `>= key`
- `merge(left, right)` combines two treaps when every key in `left` is smaller

This split/merge form is why treaps are beloved in competitive programming. The code is short and expressive.

## Complexity

| Operation | Expected time |
|---|---|
| Search | $O(\log n)$ |
| Insert | $O(\log n)$ |
| Delete | $O(\log n)$ |
| Split / merge | $O(\log n)$ |

The guarantee is expected, not worst-case deterministic.

## When treaps are useful

Treaps shine when you want:

- a balanced ordered set or map
- order statistics or implicit sequence tricks
- split/merge-friendly tree operations
- something lighter than implementing a red-black tree from scratch

They are rarer in interviews, but they appear often in algorithmic programming because the abstraction is so clean.

## Key takeaways

- A treap is a BST by key and a heap by random priority at the same time
- Random priorities make the height logarithmic in expectation
- Split and merge are the signature operations that make treaps powerful
- This is a rare structure, but it teaches a great design lesson: randomness can simplify balance dramatically

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Implicit Treap tutorials](https://cp-algorithms.com/data_structures/treap.html) | 🔴 Hard | Split/merge sequence operations |
| [Ordered Set](https://cses.fi/problemset/task/1073/) | 🟡 Medium | Balanced BST concepts apply |
| [Treap references](https://usaco.guide/adv/treaps?lang=cpp) | 🔴 Hard | Randomized balancing and splits |

## Relation to other topics

- **Binary search tree** provides the ordering rule
- **Heap** provides the priority rule
- Treap is one of the cleanest examples of combining two simpler structures into one richer one
