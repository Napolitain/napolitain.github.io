---
title: "B+ Tree"
description: "Keep routing keys in internal nodes and store all records in linked leaves so point lookups stay shallow and range scans stay fast."
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

Real database indexes usually need both:

- fast point lookups
- fast ordered range scans

A plain B-Tree helps with page-efficient search, but B+ Trees sharpen the design for database workloads.

## Core idea

In a B+ Tree:

- internal nodes store only separator keys for routing
- all actual records live in the leaves
- leaves are linked in sorted order

That last property is huge. Once you find the first matching leaf, a range scan can walk leaf-to-leaf sequentially.

## Why it matters

B+ Trees dominate database indexing because they optimize the exact access pattern databases care about:

> route quickly, then scan sequentially when the query asks for a key range

This is why range queries, ordered iteration, and page locality feel so natural in B+ Trees.

## B-Tree vs B+ Tree

| Structure | Internal nodes | Leaves | Range scans |
|---|---|---|---|
| B-Tree | may store records/keys | records may appear before leaves | okay |
| B+ Tree | routing keys only | all records live here | excellent |

By pushing records to the leaves, internal fanout often improves too, because routing nodes can hold more separators.

## Complexity

| Operation | Time |
|---|---|
| Search | $O(\log_B n)$ page levels |
| Insert | $O(\log_B n)$ |
| Delete | $O(\log_B n)$ |
| Range scan after first hit | sequential over touched leaves |

## Key takeaways

- B+ Trees are the practical database-focused cousin of B-Trees
- Internal nodes route; leaves store the ordered data
- Linked leaves make ordered scans efficient and predictable
- If you hear "database index," this is often the mental model to reach for first

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [B+ Tree overview](https://en.wikipedia.org/wiki/B%2B_tree) | 🔴 Hard | Leaf-linked page-friendly ordered index |
| [Database index references](https://use-the-index-luke.com/) | 🔴 Hard | Why ordered indexes matter for query planning |
| [Storage-engine notes](https://www.cockroachlabs.com/blog/what-is-a-b-tree/) | 🔴 Hard | B-Tree vs B+ Tree trade-offs |

## Relation to other topics

- **B-Tree** provides the page-aware balanced-search foundation
- **External Merge Sort** complements B+ Trees because both optimize sequential disk access
- **LSM Tree** is the major alternative storage-engine design when writes dominate
