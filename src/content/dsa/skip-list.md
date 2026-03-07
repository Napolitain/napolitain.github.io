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

A linked list is easy to update, but searching it linearly is slow. Balanced trees solve that, but sometimes you want an ordered structure that stays pointer-based, incremental, and easy to implement without rotations.

A skip list is the classic randomized answer.

## Intuition

Think of a skip list as several linked lists stacked on top of each other.

- the bottom level contains every key in sorted order
- each higher level contains a random subset of the level below it
- higher levels act like express lanes

Search starts at the top-left, moves right while possible, then drops down one level when it would overshoot.

So the structure behaves like binary search, but on layered linked lists instead of an array.

## Random level promotion

Each inserted key is assigned a tower height by coin flips.

```
random_level(p = 1/2, maxLevel):
    level <- 1
    while level < maxLevel and random() < p:
        level <- level + 1
    return level
```

Because tall towers are exponentially rare, the structure stays sparse at high levels and dense at low levels.

## Search

```
search(key):
    node <- head
    for level from top down to 0:
        while node.next[level] exists and node.next[level].key < key:
            node <- node.next[level]

    node <- node.next[0]
    if node exists and node.key == key:
        return FOUND
    return NOT_FOUND
```

The search path keeps moving right and down, which is why the expected time becomes logarithmic.

## Insert

Insertion first records where the new node should appear at every level.

```
insert(key):
    update[0 .. maxLevel] <- predecessors found during search
    level <- random_level()
    node <- new node(key, level)

    for i in 0 .. level-1:
        node.next[i] <- update[i].next[i]
        update[i].next[i] <- node
```

No rotations are needed. The randomness is doing the balancing work.

## Delete

```
delete(key):
    update[0 .. maxLevel] <- predecessors found during search
    node <- update[0].next[0]
    if node is absent or node.key != key:
        return

    for i in 0 .. node.level-1:
        update[i].next[i] <- node.next[i]
```

Deletion is just pointer rewiring at the node's tower levels.

## Worked example

Suppose the bottom level contains:

`1 -> 3 -> 6 -> 9 -> 12 -> 15`

and higher levels keep only some of those keys, for example:

- top level: `1 -> 9 -> 15`
- middle level: `1 -> 6 -> 9 -> 15`
- bottom level: every key

Searching for `12` jumps right on upper levels until `15` would overshoot, then drops down and continues. That is the same intuition as jumping by larger and larger blocks in a search tree.

## Complexity

| Operation | Expected time | Space |
|---|---|---|
| Search | `O(log n)` | `O(n)` expected |
| Insert | `O(log n)` | `O(n)` expected |
| Delete | `O(log n)` | `O(n)` expected |

The guarantees are expected, not worst-case deterministic, because balancing comes from randomness.

## When to choose a skip list

| Structure | Strength | Weakness |
|---|---|---|
| Skip list | Simple pointer updates, randomized balancing, good systems ergonomics | Expected bounds only |
| Balanced BST | Deterministic worst-case guarantees | Rotations and more structural bookkeeping |
| Treap | Tree-shaped randomized balancing | Still tree rotations, not list-based |
| B+ Tree | Great page locality and range scans on storage | Heavier page-oriented machinery |

Skip lists are especially attractive when you want a lightweight ordered set or map that plays well with concurrent or write-buffered systems code.

## Key takeaways

- A skip list is a linked-list answer to ordered search.
- Randomized tower heights replace explicit balancing rules and rotations.
- Search is a repeated right-or-down walk through express lanes.
- The implementation is often simpler than a balanced tree, which is why skip lists show up in real systems.
- LSM-tree memtables frequently use skip lists because inserts are simple and ordered iteration is natural.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Design Skiplist](https://leetcode.com/problems/design-skiplist/) | Hard | Implement randomized levels directly |
| [Skip list overview](https://en.wikipedia.org/wiki/Skip_list) | Hard | Search and insertion with layered pointers |
| [Pugh's original skip list paper](https://epaperpress.com/sortsearch/download/skiplist.pdf) | Hard | Why random levels give expected logarithmic behavior |

## Relation to other topics

- **Linked List** provides the pointer-based base layer a skip list extends.
- **Binary Search** gives the ordered-search intuition even though skip lists are not arrays.
- **Binary Search Tree** and **Treap** are tree-shaped alternatives to the same ordered-set problem.
- **LSM Tree** memtables are often implemented as skip lists in practice.
