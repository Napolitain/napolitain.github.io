---
title: "B-Tree"
description: "Store many keys per node so ordered search stays shallow and expensive page reads stay low."
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

A binary search tree is conceptually clean, but it is a bad storage-engine default when every node visit may cost a page read.

If one lookup walks through many tiny nodes, the tree spends more time waiting for storage than comparing keys.

## Intuition

A B-Tree reduces height by storing **many keys per node**.

Each node corresponds to a page-sized block of sorted separator keys. Instead of branching by 2, the tree branches by a large factor `B`, so the height becomes roughly:

$$
O(\log_B n)
$$

That is the whole design goal: trade more work inside one node for fewer page hops between nodes.

## Structural rules

Using the standard minimum-degree notation `t`:

- every node stores between `t - 1` and `2t - 1` keys, except the root
- an internal node with `k` keys has `k + 1` children
- every non-root internal node has between `t` and `2t` children
- keys inside a node are sorted
- all leaves appear at the same depth

Those occupancy rules keep the tree balanced while preserving high fanout.

## Search

Search inside the current node, then descend into the child interval that contains the target key.

```
search(node, key):
    find smallest i such that key <= node.keys[i]

    if i exists and node.keys[i] == key:
        return FOUND
    if node is leaf:
        return NOT_FOUND
    return search(node.child[i], key)
```

In practice, the search inside one node is often a binary search over that node's sorted key array.

## Insertion

The clean insertion strategy is: **never descend into a full child**.

### Split a full child

```
split_child(parent, i):
    y <- parent.child[i]
    z <- new node

    move y.keys[t .. 2t-2] into z
    median <- y.keys[t-1]
    keep y.keys[0 .. t-2]

    if y is not leaf:
        move y.children[t .. 2t-1] into z

    insert z as parent's child after y
    insert median into parent.keys at position i
```

### Insert into a non-full node

```
insert_non_full(node, key):
    if node is leaf:
        insert key into node.keys in sorted order
        return

    choose child i that should receive key
    if child i is full:
        split_child(node, i)
        if key > node.keys[i]:
            i <- i + 1
    insert_non_full(node.child[i], key)
```

### Full insertion

```
insert(tree, key):
    if root is full:
        newRoot <- new internal node
        newRoot.child[0] <- old root
        split_child(newRoot, 0)
        root <- newRoot
    insert_non_full(root, key)
```

The split pushes a separator upward and keeps the tree balanced automatically.

## Deletion

Deletion is harder because nodes are not allowed to become too empty.

High-level cases:

1. **Delete from a leaf** if the node still has enough keys afterward.
2. **Delete from an internal node** by replacing the key with its predecessor or successor if a child can spare one.
3. **Borrow from a sibling** if a target child is too small.
4. **Merge siblings** if neither sibling can spare a key, then continue recursively.

The invariant is the mirror image of insertion: when descending, try not to enter a child that is already at the minimum occupancy.

## Worked example

Suppose one page can hold about 200 keys.

Then one root page can branch to roughly 201 children. Two more levels below it cover about:

$$
201^3 \approx 8{,}120{,}601
$$

leaf ranges.

That is why B-Trees are such a natural storage-engine structure: a tiny height can cover a huge ordered dataset.

## Complexity

| Operation | Time |
|---|---|
| Search | `O(log_B n)` page levels |
| Insert | `O(log_B n)` |
| Delete | `O(log_B n)` |
| Space | `O(n)` |

Within each page there is also a small search over the node's key array, but the dominant cost in storage systems is usually page depth.

## B-Tree vs. BST vs. B+ Tree

| Structure | Fanout | Best for |
|---|---|---|
| Binary search tree | 2 | In-memory ordered search |
| B-Tree | Large | Page-efficient ordered search |
| B+ Tree | Large, leaf-linked | Database indexes and range scans |

B-Trees are the conceptual bridge from classic search trees to real storage-engine indexes.

## Key takeaways

- B-Trees exist to minimize **page depth**, not just comparison count.
- The defining operations are **split on overflow** and **borrow/merge on underflow**.
- High fanout is what makes the structure shallow enough for storage systems.
- Search, insert, and delete all stay logarithmic in the number of page levels.
- B+ Trees take the same page-aware idea and optimize it further for range scans and practical indexing.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [B-Tree overview](https://en.wikipedia.org/wiki/B-tree) | Hard | Page-sized balanced search tree |
| [PostgreSQL B-tree docs](https://www.postgresql.org/docs/current/btree.html) | Hard | Ordered indexes in a real engine |
| [CLRS B-tree chapter notes](https://walkccc.me/CLRS/Chap18/18.1/) | Hard | Split, insert, and delete invariants |

## Relation to other topics

- **Binary Search** explains why sorted separators are enough to route a search.
- **Binary Search Tree** is the narrow-fanout in-memory ancestor of the same ordered-search idea.
- **B+ Tree** is the database-optimized variant most engines prefer for indexed scans.
- **External Merge Sort** sits nearby because both topics are shaped by page and disk costs.
