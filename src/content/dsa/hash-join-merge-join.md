---
title: "Hash Join & Merge Join"
description: "Compare the two most important database join strategies: build-and-probe hashing versus ordered merge scanning."
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

A SQL join is not one algorithm. A database optimizer must choose a physical operator based on:

- join predicate shape
- whether inputs are already sorted
- how much memory is available
- whether disk I/O will dominate the work

Two of the most important operators are **hash join** and **merge join**.

## Intuition

Both operators solve the same high-level task: pair rows from `R` and `S` whose join keys match.

They differ in what structure they build first:

- **hash join** builds a hash table on one side, then probes it
- **merge join** relies on both sides being sorted, then walks them like a merge step

So the choice is really:

> should we pay for hashing, or should we pay for sorted order?

## Hash join

Hash join is the standard equality-join workhorse.

### Algorithm

Choose the smaller input as the build side.

```
hash_join(R, S):
    H <- empty hash table

    for row in R:
        H[row.key].append(row)

    for row in S:
        for match in H[row.key]:
            emit combine(match, row)
```

### Why it works

The build phase groups rows by join key. The probe phase turns each lookup on `S` into a constant-time average hash-table access.

### Best use case

- equality joins
- smaller build side fits comfortably in memory
- no useful sorted order already exists

If the build side does not fit in memory, databases fall back to partitioned or grace-hash variants that hash both sides into smaller chunks first.

## Merge join

Merge join wins when both inputs are sorted on the join key, or when sorting them is still cheaper than building and probing hashes.

### Algorithm

```
merge_join(R_sorted, S_sorted):
    i <- 0
    j <- 0

    while i < len(R_sorted) and j < len(S_sorted):
        if R_sorted[i].key < S_sorted[j].key:
            i <- i + 1
        else if R_sorted[i].key > S_sorted[j].key:
            j <- j + 1
        else:
            key <- R_sorted[i].key
            rGroup <- all rows in R_sorted with this key
            sGroup <- all rows in S_sorted with this key
            emit every pair from rGroup x sGroup
            advance i and j past those groups
```

### Why it works

Once both sides are sorted, smaller keys can never match larger keys later. That lets the pointers move only forward.

### Best use case

- inputs are already sorted by index or previous operators
- range-oriented ordered pipelines matter
- merge order will be reused by downstream operators

## Worked example

Suppose we join:

- `Orders(order_id, customer_id)`
- `Customers(customer_id, name)`

### Hash join view

Build a hash table on `Customers` by `customer_id`, then stream through `Orders` and probe each order's customer.

### Merge join view

If both tables are already sorted by `customer_id`, keep two pointers and advance whichever side is smaller until keys line up.

The output rows are identical. The cost profile is not.

## Complexity and cost model

Let `|R| = r` and `|S| = s`.

| Operator | CPU view | Memory / I/O story |
|---|---|---|
| Hash join | `O(r + s)` average after building the table | Great if build side fits in memory; spills require partitioning |
| Merge join with pre-sorted inputs | `O(r + s)` | Excellent when sorted order already exists |
| Merge join with sorting required | `O(r log r + s log s + r + s)` | External merge sort may dominate if inputs are large |

In real systems, the I/O story often matters more than the CPU formula.

## When to choose which

| Situation | Better choice | Reason |
|---|---|---|
| Equality join, one side fits in memory, no useful ordering | Hash join | Cheap build-and-probe path |
| Both sides already sorted by join key | Merge join | Reuse existing order and scan once |
| Ordered output helps later operators | Merge join | Sorted pipeline stays useful downstream |
| Inputs are huge and sorting would be expensive | Hash join if memory permits | Avoid paying sort cost |

## Key takeaways

- Join strategy is an algorithm choice, not just a database implementation detail.
- **Hash join** turns the join key into a hash-table lookup problem.
- **Merge join** turns the join key into a two-pointer ordered-scan problem.
- If sorted order already exists, merge join can be extremely attractive.
- If no order exists and an equality join dominates, hash join is usually the first candidate.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Hash join overview](https://en.wikipedia.org/wiki/Hash_join) | Hard | Build side plus probe side |
| [Sort-merge join overview](https://en.wikipedia.org/wiki/Sort-merge_join) | Hard | Ordered two-pointer join |
| [CMU 15-445 execution notes](https://15445.courses.cs.cmu.edu/fall2023/notes/10-execution1.pdf) | Hard | Physical operator trade-offs inside query engines |

## Relation to other topics

- **Hash Map** is the core data structure behind hash join.
- **Merge Sort** and **External Merge Sort** explain where merge join gets its ordered inputs.
- **B+ Tree** indexes often provide the ordered access pattern that makes merge-style processing attractive.
