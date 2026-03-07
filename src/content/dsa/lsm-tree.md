---
title: "LSM Tree"
description: "Trade read complexity for write throughput by buffering writes in memory and organizing on-disk data as sorted runs that compact in the background."
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

B+ Trees are strong when reads and ordered updates dominate, but some workloads are overwhelmingly write-heavy.

If every insert must immediately rewrite or rebalance page structures, write throughput suffers.

## Core idea

An LSM Tree separates the write path into stages:

1. write to an in-memory sorted structure such as a skip list
2. append to a write-ahead log for durability
3. flush the memtable into immutable sorted files (SSTables)
4. compact files in the background into larger, cleaner levels

Instead of eagerly maintaining one perfect on-disk tree, the system batches and reorganizes writes later.

## Why it matters

LSM Trees are the canonical storage-engine answer when writes dominate.

They appear in systems like RocksDB, LevelDB, Cassandra, and many modern key-value stores.

## Read trade-off

The price of write speed is that reads may need to check:

- the memtable
- recent SSTables
- lower levels

That is why Bloom filters, compaction strategy, and layout policy matter so much in LSM-based engines.

## Complexity intuition

Exact costs depend on the compaction policy, but the design goal is:

- cheap sequential writes
- background amortization of sort/merge work
- acceptable read amplification managed by filters and leveling

## Key takeaways

- LSM Trees optimize for write throughput by buffering and compacting
- Skip lists and sorted-run merges are central building blocks
- Reads get harder, so Bloom filters and compaction policy become first-class concerns
- This is one of the most important systems data structures in modern storage engines

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [LSM Tree overview](https://en.wikipedia.org/wiki/Log-structured_merge-tree) | 🔴 Hard | Memtables, SSTables, compaction |
| [RocksDB overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview) | 🔴 Hard | Real LSM implementation trade-offs |
| [LevelDB impl notes](https://github.com/google/leveldb/blob/main/doc/impl.md) | 🔴 Hard | Sorted runs plus background merging |

## Relation to other topics

- **Skip List** is a common memtable implementation
- **Bloom Filter & Cuckoo Filter** explain how reads can skip many SSTables cheaply
- **External Merge Sort** captures the merge-heavy flavor of compaction work
- **B+ Tree** is the classic ordered-index alternative when the workload trade-offs differ
