---
title: "Hash Join & Merge Join"
description: "Compare the two most important database join strategies: build-and-probe hashing versus sort-and-scan merging."
date: 2026-03-07
tags: ["database", "join", "hashing", "sorting"]
draft: false
visualization: "HashMergeJoinVisualization"
family: "systems"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["hash-map", "merge-sort"]
related: ["external-merge-sort", "b-plus-tree"]
enables: []
---

## Problem

Joining tables is not one algorithm. Database systems choose among several physical join operators depending on data size, ordering, and predicate shape.

Two of the most important are **hash join** and **merge join**.

## Hash join

Hash join works best for equality joins.

Typical flow:

1. build a hash table on the smaller input
2. stream the larger input and probe the hash table

This is fast when hashing is cheap and the build side fits comfortably in memory or partitions well.

## Merge join

Merge join assumes both inputs are sorted on the join key, or can be sorted first.

Then it behaves like a two-pointer merge over two ordered streams.

That makes it attractive when:

- inputs are already ordered by indexes or previous operators
- range-friendly ordered pipelines matter
- external sorting is acceptable or already done

## Why it matters

This is where familiar DSA ideas become actual database execution plans:

- hash maps become join accelerators
- merge-style scanning becomes an ordered relational operator

## Complexity intuition

Exact performance depends on memory, skew, and I/O, but the big trade-off is:

- **hash join**: hashing + probe cost
- **merge join**: sorting cost + linear ordered scan

## Key takeaways

- Join strategy is an algorithmic choice driven by workload and data layout
- Hash join is usually the equality-join workhorse
- Merge join becomes attractive when sorted order already exists or can be exploited downstream
- This topic is important because it shows how classic DSA ideas reappear inside database query engines

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Hash join overview](https://en.wikipedia.org/wiki/Hash_join) | 🔴 Hard | Build-and-probe relational operator |
| [Merge join overview](https://en.wikipedia.org/wiki/Sort-merge_join) | 🔴 Hard | Ordered join via two-way scan |
| [Database execution notes](https://15445.courses.cs.cmu.edu/fall2023/notes/10-execution1.pdf) | 🔴 Hard | Physical operator trade-offs |

## Relation to other topics

- **Hash Map** is the key data structure behind hash join
- **Merge Sort** and **External Merge Sort** explain how merge join gets or exploits sorted inputs
- **B+ Tree** indexes often provide the ordered access paths that make merge-style processing attractive
