---
title: "Count-Min Sketch"
description: "Estimate item frequencies in a stream with a tiny 2D counter array and a few hash functions."
date: 2026-03-07
tags: ["sketch", "streaming", "frequency", "rare"]
draft: false
visualization: "CountMinSketchVisualization"
family: "probabilistic"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["hash-map"]
related: ["bloom-cuckoo-filters", "hyperloglog", "cache-eviction-strategies"]
enables: []
---

## Problem

Exact frequency counting with a hash map can be too large when the stream is enormous or the key space is unbounded.

Sometimes you only need a compact estimate of how often an item has appeared.

## Core idea

A Count-Min Sketch keeps several rows of counters.

For each arriving item:

- hash it once per row
- increment the corresponding counter in that row

To estimate an item's count, hash it across the same rows and take the **minimum** touched counter.

Because collisions only add extra counts, the estimate is never smaller than the true value.

## Why it matters

This structure is a standard streaming tool for:

- heavy-hitter detection
- traffic analysis
- telemetry and logging
- cache admission heuristics

## Complexity

If there are `d` rows:

| Operation | Time |
|---|---|
| Update | $O(d)$ |
| Query | $O(d)$ |

Space depends on row count and width, not on the number of distinct items seen.

## Key takeaways

- Count-Min Sketch estimates **frequency**, not membership or cardinality
- Collisions bias upward, which is why queries take the minimum counter value
- It is a classic streaming/data-system approximation tool
- This is rare material in interview prep, but common in large-scale measurement systems

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Count-Min Sketch overview](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) | 🔴 Hard | Hashed counter rows and minimum query |
| [Streaming references](https://book.moa.cms.waikato.ac.nz/chapter_4.html/) | 🔴 Hard | Approximate frequency tracking |
| [TinyLFU references](https://arxiv.org/abs/1512.00727) | 🔴 Hard | Count sketch ideas inside cache admission |

## Relation to other topics

- **Bloom Filter & Cuckoo Filter** solve membership rather than frequency
- **HyperLogLog** estimates distinct count rather than per-item count
- **Cache Eviction Strategies** like TinyLFU often use sketch-style frequency estimation
