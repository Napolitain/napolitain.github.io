---
title: "External Merge Sort"
description: "Sort data larger than RAM by generating sorted runs and merging them with mostly sequential disk I/O."
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

Plain merge sort assumes the whole array fits in memory. Database and analytics systems routinely need to sort data far larger than RAM.

When that happens, the real enemy is not comparison count. It is disk I/O, especially random I/O.

## Intuition

External merge sort keeps the merge-sort idea but changes the cost model.

Instead of splitting recursively inside RAM, it works in two big phases:

1. **run generation**: read as much as memory can hold, sort that chunk in RAM, and write it back as a sorted run
2. **k-way merging**: merge many sorted runs using sequential reads and writes

The algorithm is trying to touch disk in long, predictable sweeps instead of random jumps.

## Phase 1: generate sorted runs

Assume memory can hold `M` pages and the input has `N` pages.

```
generate_runs(input, M):
    runs <- []
    while input still has data:
        chunk <- read up to M pages
        sort chunk in memory
        run <- write chunk back to disk
        runs.append(run)
    return runs
```

After this phase, the input has been transformed into `ceil(N / M)` sorted runs on disk.

## Phase 2: k-way merge

Use one input buffer per run, one output buffer, and a min-heap that stores the smallest current item from each run.

```
k_way_merge(runs):
    heap <- empty min-heap

    for each run:
        load its first buffered item into heap

    while heap is not empty:
        item, runId <- heap.pop_min()
        append item to output buffer
        if output buffer is full:
            flush it to disk
        if runId has more buffered data:
            push next item from runId into heap
        else if runId has more disk pages:
            load next page from runId
            push its first item into heap
```

The heap keeps the current minimum among all active runs, which is exactly the same idea as merge sort generalized from 2 runs to `k` runs.

## Worked example

Suppose the file has `N = 1000` pages and memory holds `M = 100` pages.

### Run generation

- read 100 pages
- sort them in memory
- write them back
- repeat 10 times

Now there are 10 sorted runs.

### Merge

If memory can support 10 input buffers plus 1 output buffer, the whole file can be merged in one pass.

Total I/O:

- read + write during run generation -> `2N`
- read + write during merge -> `2N`

So the whole sort costs about `4N` page I/Os.

That is the type of accounting systems engineers actually care about.

## Complexity

Let `R = ceil(N / M)` be the number of initial runs, and let `k` be the merge fan-in.

| Measure | Cost |
|---|---|
| Run generation CPU | in-memory sort per chunk |
| Merge CPU | `O(N log k)` comparisons over all items |
| Initial runs | `R = ceil(N / M)` |
| Extra merge passes | `ceil(log_k R)` |
| Total I/O | about `2N * (1 + ceil(log_k R))` page transfers |

The asymptotic CPU view matters less than the number of full disk passes.

## When external merge sort is the right tool

| Situation | Why it fits |
|---|---|
| `ORDER BY` on data larger than memory | Sorting can be staged through disk |
| Sort-merge join | Merge join needs ordered inputs |
| LSM compaction-like pipelines | Many sorted runs need to be merged efficiently |
| Offline data preparation | Sequential disk passes are acceptable |

## External merge sort vs. in-memory merge sort

| Property | In-memory merge sort | External merge sort |
|---|---|---|
| Primary cost | CPU comparisons | Disk passes and buffer management |
| Working set | Full array fits in RAM | Data exceeds RAM |
| Merge shape | Usually 2-way | Often k-way |
| Key optimization target | Clean recursion and cache locality | Sequential I/O and fewer full passes |

## Key takeaways

- External merge sort is merge sort adapted to the memory hierarchy, especially disks and pages.
- Run generation creates sorted chunks; k-way merging stitches them back together.
- A **heap** is the natural data structure for the k-way merge frontier.
- The most important formula is not a pure CPU bound. It is the number of full read/write passes over the data.
- This algorithm is foundational for database sorting, merge joins, and LSM-style compaction work.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [External sorting overview](https://en.wikipedia.org/wiki/External_sorting) | Hard | Run generation plus multi-way merge |
| [CMU storage notes](https://15445.courses.cs.cmu.edu/fall2023/notes/04-storage1.pdf) | Hard | Sorting under page constraints |
| [Use The Index, Luke - sorting](https://use-the-index-luke.com/sql/sorting-grouping) | Hard | Why ordered external processing matters in SQL engines |

## Relation to other topics

- **Merge Sort** supplies the split-and-merge intuition.
- **Heap** usually powers the k-way merge frontier.
- **LSM Tree** compaction has the same merge-heavy flavor, just spread across levels and files.
- **Hash Join & Merge Join** rely on external sorting when ordered inputs are not already available.
