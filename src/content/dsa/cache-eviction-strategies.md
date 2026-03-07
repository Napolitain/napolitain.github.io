---
title: "Cache Eviction Strategies (LRU, LFU, ARC, TinyLFU)"
description: "Compare recency-based, frequency-based, adaptive, and admission-aware cache policies instead of treating cache replacement as one monolithic trick."
date: 2026-03-07
tags: ["cache", "lru", "lfu", "tinylfu"]
draft: false
visualization: "CacheEvictionVisualization"
family: "systems"
kind: "technique"
difficulty: "advanced"
prerequisites: ["hash-map", "linked-list"]
related: ["queue", "count-min-sketch", "consistent-hashing"]
enables: []
---

## Problem

A cache with a fixed capacity eventually has to answer the hard question:

> which item should be evicted next?

That decision shapes hit rate, latency, and memory efficiency more than the underlying hash table alone.

## Core idea

Different policies optimize for different signals:

- **LRU**: keep recently used items
- **LFU**: keep frequently used items
- **ARC**: adapt between recency and frequency automatically
- **TinyLFU**: decide whether an item deserves admission in the first place, often using approximate frequency estimates

There is no single universally best policy. The workload matters.

## Why it matters

This topic is where simple data structures meet real systems behavior.

A cache is not just a hash map with a size limit. It is a prediction system about future reuse.

## Policy snapshots

### LRU
Easy to implement with a hash map plus doubly linked list.

### LFU
Tracks long-term hot items better, but can keep stale popularity around.

### ARC
Keeps multiple lists and ghost histories to adapt automatically.

### TinyLFU
Separates **admission** from **eviction**, often using a compact sketch to estimate whether a new candidate is worth letting in.

## Complexity intuition

Most practical implementations aim for constant or amortized constant-time operations, but the real comparison is policy quality under workload, not only asymptotic notation.

## Key takeaways

- Cache eviction is an algorithmic design problem, not a minor implementation detail
- LRU and LFU optimize different reuse signals
- ARC and TinyLFU exist because real workloads need more than one simple heuristic
- TinyLFU connects cache policy directly to probabilistic counting structures like Count-Min Sketch

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [LRU Cache](https://leetcode.com/problems/lru-cache/) | 🟡 Medium | Hash map plus linked list |
| [LFU Cache](https://leetcode.com/problems/lfu-cache/) | 🔴 Hard | Frequency-aware eviction |
| [TinyLFU paper](https://arxiv.org/abs/1512.00727) | 🔴 Hard | Admission by approximate frequency |

## Relation to other topics

- **Hash Map** gives constant-time key lookup into the cache
- **Linked List** supports recency ordering for LRU-style policies
- **Count-Min Sketch** often appears inside TinyLFU-like admission logic
- **Consistent Hashing** handles where cached keys live across machines, while eviction policies handle what stays inside one cache
