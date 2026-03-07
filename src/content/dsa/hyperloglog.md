---
title: "HyperLogLog"
description: "Estimate the number of distinct items in a huge stream using tiny registers and the rarity of long leading-zero hash patterns."
date: 2026-03-07
tags: ["cardinality", "streaming", "probabilistic", "rare"]
draft: false
visualization: "HyperLogLogVisualization"
family: "probabilistic"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["hash-map"]
related: ["count-min-sketch", "bloom-cuckoo-filters"]
enables: []
---

## Problem

Exact distinct counting means storing all unique keys seen so far. That is often too expensive for telemetry, analytics, and large streaming systems.

What you really want is a very small approximation of cardinality.

## Core idea

Hash each item. Split the hash into:

- a register index
- a suffix used to measure the number of leading zeros

For each register, remember the largest leading-zero count ever seen there.

Why does that help? Because a hash with many leading zeros is rare. If you have seen one, the stream is probably large enough that such a rare event became likely.

HyperLogLog combines those register maxima into a stable distinct-count estimate.

## Why it matters

HyperLogLog is one of the most famous approximate data structures in systems work.

It shows up in:

- database analytics
- telemetry dashboards
- distributed counting
- distinct-user or unique-key estimation

## Complexity

| Operation | Time |
|---|---|
| Update | $O(1)$ |
| Estimate | $O(m)$ over registers, or cached in practice |

The memory footprint depends on the number of registers, not on the number of distinct items.

## Key takeaways

- HyperLogLog estimates **cardinality**, not membership or per-item frequency
- It works by tracking rare leading-zero patterns in hashed values
- The memory savings can be enormous compared with exact distinct counting
- This is rare advanced systems material, but one of the most practical approximate structures you can know

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [HyperLogLog overview](https://en.wikipedia.org/wiki/HyperLogLog) | 🔴 Hard | Leading-zero statistics and registers |
| [Streaming cardinality references](https://research.google/pubs/pub40671/) | 🔴 Hard | Distinct counting at scale |
| [System analytics references](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/) | 🔴 Hard | Real-world usage patterns |

## Relation to other topics

- **Bloom Filter & Cuckoo Filter** approximate membership
- **Count-Min Sketch** approximates frequency
- HyperLogLog fills the third major approximate-query niche: distinct counting
