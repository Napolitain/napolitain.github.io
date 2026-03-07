---
title: "LSM Tree"
description: "Trade read complexity for write throughput by buffering writes in memory, flushing sorted runs, and compacting them in the background."
date: 2026-03-07
tags: ["lsm-tree", "storage", "database", "rare"]
draft: false
visualization: "LsmTreeVisualization"
family: "systems"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["skip-list", "merge-sort"]
related: ["b-plus-tree", "b-tree", "bloom-cuckoo-filters", "external-merge-sort"]
enables: []
---

## Problem

B+ Trees are excellent when reads and ordered updates dominate, but some workloads are overwhelmingly write-heavy.

If every insert immediately modifies page-organized on-disk structure, write amplification and random I/O can become the bottleneck.

## Intuition

An LSM Tree delays expensive on-disk organization.

Instead of maintaining one perfectly updated tree at all times, it stages the write path:

1. accept writes into an in-memory sorted structure
2. append them to a write-ahead log for durability
3. flush full memory buffers into immutable sorted files
4. compact those files later in large sequential batches

So the design trades **eager organization** for **batched organization**.

## Core components

- **WAL**: append-only durability log
- **memtable**: in-memory sorted structure, often a skip list
- **immutable memtable**: waiting to flush
- **SSTables**: immutable sorted files on disk
- **Bloom filters / indexes**: help avoid checking every SSTable on reads
- **compaction**: background merge process that rewrites and cleans overlapping runs

## Write path

```
put(key, value):
    append (key, value) to WAL
    memtable.insert(key, value)

    if memtable is full:
        freeze memtable as immutable
        create new empty memtable
        flush immutable memtable to a new SSTable
```

The foreground write is cheap because it mostly touches memory and the end of the WAL.

## Read path

```
get(key):
    if key is in memtable:
        return newest value

    if key is in immutable memtables:
        return newest value

    for each relevant SSTable from newest to oldest:
        if Bloom filter says definitely absent:
            continue
        if on-disk index may contain key:
            search the SSTable
            if found:
                return value

    return NOT_FOUND
```

Reads are harder than writes because the newest value may exist in several layers.

## Compaction

Compaction is the background merge engine that keeps the system from degenerating into infinitely many tiny sorted files.

```
compact(selectedTables):
    stream the selected SSTables in key order
    keep only the newest visible version of each key
    write merged output into larger SSTables
    delete old input tables
```

This is basically external merge work plus version cleanup.

## Leveled vs. tiered compaction

| Policy | Shape | Strength | Weakness |
|---|---|---|---|
| Leveled | Each level has bounded overlap | Better point reads, lower space amplification | More write amplification |
| Tiered / size-tiered | Several runs per level before merge | Better write throughput | More read amplification |

This is the same recurring systems trade-off: write now and clean later, or organize more aggressively up front.

## Worked example

Suppose key `user:7` is updated three times.

1. newest value lives in the memtable
2. old values still exist in one or more SSTables
3. reads must search newest structures first
4. compaction eventually merges those files and discards stale versions

So an LSM Tree is not just a tree. It is a pipeline of sorted structures across time.

## Complexity and trade-offs

Exact costs depend on compaction policy, but the qualitative picture is stable.

| Operation | Typical story |
|---|---|
| Write | Very fast foreground path, usually close to append + memory insert |
| Point read | May touch several levels, but Bloom filters cut many misses |
| Range scan | Good sequential behavior, but may need to merge overlapping runs |
| Space | Extra space is needed during compaction and while multiple versions coexist |

The key systems terms are:

- **write amplification**: how much extra rewriting compaction creates
- **read amplification**: how many structures a read may need to inspect
- **space amplification**: how much extra storage is consumed by duplicates and overlap

## LSM Tree vs. B+ Tree

| Question | LSM Tree | B+ Tree |
|---|---|---|
| Write-heavy workload | Usually better | Often worse |
| Point reads | Can be good, but depends on filters and levels | Very predictable |
| Range scans | Good, but may merge multiple runs | Excellent ordered leaf scans |
| Core cost | Background compaction | Page updates and rebalancing |

## Key takeaways

- An LSM Tree is built around **buffering, flushing, and compaction**.
- The foreground write path is cheap because it writes sequentially and updates memory first.
- Reads are harder, which is why **Bloom filters**, indexes, and compaction policy matter so much.
- Compaction is the hidden algorithmic heart of the structure.
- LSM Trees are the natural choice when write throughput matters enough to justify more complex read behavior.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [LSM Tree overview](https://en.wikipedia.org/wiki/Log-structured_merge-tree) | Hard | Memtables, SSTables, and compaction |
| [RocksDB overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview) | Hard | Real storage-engine trade-offs |
| [LevelDB implementation notes](https://github.com/google/leveldb/blob/main/doc/impl.md) | Hard | Sorted runs plus background merging |

## Relation to other topics

- **Skip List** is a common memtable implementation.
- **Bloom Filter & Cuckoo Filter** explain how reads can skip many SSTables cheaply.
- **External Merge Sort** captures the merge-heavy flavor of compaction work.
- **B+ Tree** is the classic ordered-index alternative when the workload trade-offs differ.
