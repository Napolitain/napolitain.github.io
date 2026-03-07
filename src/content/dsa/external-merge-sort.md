---
title: "External Merge Sort"
description: "Sort datasets larger than RAM by writing sorted runs to disk and then merging them with sequential I/O."
date: 2026-03-07
tags: ["sorting", "disk", "database", "rare"]
draft: false
visualization: "ExternalMergeSortVisualization"
family: "systems"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["merge-sort", "heap"]
related: ["b-plus-tree", "lsm-tree", "hash-join-merge-join"]
enables: ["hash-join-merge-join"]
---

## Problem

Merge sort assumes the array is in memory. Real database and analytics workloads often need to sort data far larger than RAM.

## Core idea

External merge sort keeps the merge-sort philosophy but changes the cost model to respect disk:

1. read a memory-sized chunk
2. sort it in RAM
3. write the sorted chunk back as a run
4. perform a multi-way merge over the runs using mostly sequential I/O

The algorithm is really about minimizing expensive random disk access.

## Why it matters

External merge sort is the backbone of many database and data-processing systems.

It appears in:

- large ORDER BY operations
- sort-merge joins
- compaction-like merge pipelines
- offline data preparation jobs

## Complexity intuition

The real bottleneck is I/O passes, not CPU comparison count.

That is why the important questions are:

- how many runs are created?
- how many passes of merging are needed?
- how sequential are the reads and writes?

## Key takeaways

- External merge sort is merge sort adapted to the memory hierarchy
- Sequential I/O is the optimization target, not only asymptotic CPU work
- Heaps often help implement the k-way merge stage cleanly
- This is one of the most important system-level sorting algorithms in practice

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [External sorting overview](https://en.wikipedia.org/wiki/External_sorting) | 🔴 Hard | Run generation plus merge passes |
| [Database systems references](https://15445.courses.cs.cmu.edu/fall2023/notes/04-storage1.pdf) | 🔴 Hard | Sorting under page constraints |
| [Merge-based systems notes](https://use-the-index-luke.com/sql/sorting-grouping) | 🔴 Hard | Why ordered external processing matters |

## Relation to other topics

- **Merge Sort** supplies the basic split-and-merge intuition
- **Heap** often powers the k-way merge over many runs
- **LSM Tree** and **Hash Join & Merge Join** both benefit from merge-oriented external processing
