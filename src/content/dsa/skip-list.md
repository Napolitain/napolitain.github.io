---
title: "Skip List"
description: "Layer multiple forward-pointer lists on top of each other so ordered search behaves like a randomized tree while staying list-based."
date: 2026-03-07
tags: ["skip-list", "ordered-set", "search"]
draft: false
visualization: "SkipListVisualization"
family: "systems"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["binary-search", "linked-list"]
related: ["binary-search-tree", "treap", "lsm-tree"]
enables: ["lsm-tree"]
---

## Problem

Linked lists are easy to update, but searching them linearly is slow.

Balanced trees fix search time, but sometimes you want something simpler, pointer-based, and friendly to concurrent or systems-oriented implementations.

## Core idea

A skip list is a stack of linked lists:

- the bottom level contains every key in sorted order
- higher levels contain a random subset of keys
- search starts at the top and drops downward when it can no longer move right

Those upper levels behave like express lanes.

## Why it matters

Skip lists are a beautiful example of getting logarithmic expected search without strict tree rotations or rebalancing rules.

That simplicity is why they show up in real systems, especially in write-optimized storage components and concurrent ordered sets.

## Complexity

| Operation | Expected time |
|---|---|
| Search | $O(\log n)$ |
| Insert | $O(\log n)$ |
| Delete | $O(\log n)$ |

The guarantees are expected because the structure depends on random level promotion.

## Key takeaways

- A skip list is a linked-list answer to ordered search
- Randomized levels replace explicit balancing rules
- It often competes with balanced trees in real systems because the implementation can be lightweight
- This is a systems-friendly alternative to BST-style ordered maps and sets

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Design Skiplist](https://leetcode.com/problems/design-skiplist/) | 🔴 Hard | Build the randomized levels directly |
| [Skip list overview](https://en.wikipedia.org/wiki/Skip_list) | 🔴 Hard | Search/insertion with layered pointers |
| [System design references](https://www.p99conf.io/2021/06/17/skiplist.html) | 🔴 Hard | Why ordered lists with towers are practical |

## Relation to other topics

- **Linked List** provides the pointer-based base layer skip lists extend
- **Binary Search** gives the ordered-search intuition even though skip lists are not arrays
- **Binary Search Tree** and **Treap** are tree-shaped alternatives to the same ordered-set problem
- **LSM Tree** memtables are often implemented as skip lists in practice
