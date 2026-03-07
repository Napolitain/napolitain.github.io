---
title: "B+ Tree"
description: "Keep routing keys in internal nodes and all records in linked leaves so point lookups stay shallow and range scans stay fast."
date: 2026-03-07
tags: ["b-plus-tree", "database", "index", "range-scan"]
draft: false
visualization: "BPlusTreeVisualization"
family: "systems"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["b-tree"]
related: ["binary-search-tree", "lsm-tree", "external-merge-sort"]
enables: []
---

## Problem

Database indexes usually need both:

- fast point lookups
- fast ordered range scans

A plain B-Tree already reduces page depth, but a B+ Tree sharpens the layout for the exact access pattern databases care about most.

## Intuition

A B+ Tree separates **routing** from **storage**.

- internal nodes store only separator keys
- all actual records live in the leaves
- leaves are linked in sorted order

That last property is the game changer. After finding the first matching key, a range scan can continue by following leaf pointers instead of repeatedly climbing back through the tree.

## Search

Search looks almost identical to a B-Tree search, except internal nodes never hold the final records.

```
search(node, key):
    while node is not a leaf:
        choose the child interval containing key
        node <- chosen child

    binary search inside the leaf
    return matching record if present
```

The internal nodes are just a page-efficient routing index.

## Insertion

### Insert into a leaf

```
insert(tree, key, record):
    leaf <- find_leaf(tree.root, key)
    insert (key, record) into leaf in sorted order

    if leaf overflowed:
        split_leaf(leaf)
```

### Split a leaf

```
split_leaf(leaf):
    newLeaf <- new leaf
    move upper half of entries from leaf into newLeaf
    newLeaf.next <- leaf.next
    leaf.next <- newLeaf

    separator <- first key in newLeaf
    insert separator into parent routing node
```

The promoted separator is just a routing key. The records stay in the leaves.

### Split an internal node

If a parent overflows after receiving the separator, split that internal node as well and continue upward just like in a B-Tree.

## Range scan

Range scans are where B+ Trees really justify themselves.

```
range_scan(L, R):
    leaf <- find first leaf that could contain L

    while leaf exists:
        for entry in leaf in sorted order:
            if entry.key < L:
                continue
            if entry.key > R:
                return
            emit entry
        leaf <- leaf.next
```

Once the first leaf is found, the scan becomes mostly sequential leaf traversal.

## Worked example

Suppose you want all keys in `[30, 60]`.

1. descend through internal routing nodes until you reach the first leaf containing `30`
2. emit all matching entries in that leaf
3. continue through `leaf.next`, `leaf.next.next`, and so on
4. stop when keys exceed `60`

This is exactly why B+ Trees dominate ordered indexes: range queries become natural and page-friendly.

## Complexity

| Operation | Time |
|---|---|
| Point lookup | `O(log_B n)` page levels |
| Insert | `O(log_B n)` |
| Delete | `O(log_B n)` |
| Range scan after first hit | sequential over touched leaves |

The first lookup is logarithmic. The scan that follows is efficient because the leaves are already linked in key order.

## B-Tree vs. B+ Tree

| Property | B-Tree | B+ Tree |
|---|---|---|
| Internal nodes | May store records or keys | Store routing keys only |
| Leaves | Not the only place records may appear | Hold all records |
| Range scans | Fine | Excellent |
| Internal fanout | Good | Often even better because nodes hold only separators |

By pushing records to the leaves, a B+ Tree often fits more separators per internal page and therefore stays even shallower.

## Key takeaways

- A B+ Tree is a B-Tree optimized for **point lookup plus ordered scan** workloads.
- Internal nodes route; leaves store the real data.
- Leaf links are what turn the structure into a first-class range-scan index.
- Splitting a leaf promotes a separator upward but keeps the records in the leaves.
- If you hear "database index," this is usually the mental model to reach for first.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [B+ Tree overview](https://en.wikipedia.org/wiki/B%2B_tree) | Hard | Leaf-linked page-friendly ordered index |
| [Use The Index, Luke](https://use-the-index-luke.com/) | Hard | Why ordered indexes matter for query planning |
| [CockroachDB index overview](https://www.cockroachlabs.com/blog/what-is-a-b-tree/) | Hard | Practical B-tree and B+ tree trade-offs |

## Relation to other topics

- **B-Tree** provides the page-aware balanced-search foundation.
- **External Merge Sort** complements B+ Trees because both optimize ordered sequential access.
- **LSM Tree** is the major storage-engine alternative when writes dominate strongly enough to justify compaction-heavy design.
