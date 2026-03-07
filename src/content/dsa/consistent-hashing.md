---
title: "Consistent Hashing"
description: "Map keys onto a ring so adding or removing servers moves only a small fraction of keys instead of reshuffling the whole cluster."
date: 2026-03-07
tags: ["distributed", "hashing", "cache", "rare"]
draft: false
visualization: "ConsistentHashingVisualization"
family: "systems"
kind: "technique"
difficulty: "advanced"
prerequisites: ["hash-map"]
related: ["cache-eviction-strategies", "bloom-cuckoo-filters"]
enables: []
---

## Problem

If you assign keys to servers with `hash(key) % n`, adding or removing one server remaps almost everything.

That is terrible for distributed caches and partitioned storage.

## Core idea

Place both servers and keys on a logical hash ring.

A key belongs to the first server encountered when moving clockwise around the ring.

When a server is added or removed, only keys in nearby ring regions move.

## Why it matters

Consistent hashing is the canonical answer when you want stable placement under cluster membership changes.

It appears in:

- distributed caches
- sharded key-value stores
- load balancing and partition placement

## Virtual nodes

Real systems often assign several virtual positions per server to smooth imbalance.

That way, load distribution becomes more even and adding a server does not create one giant hot region.

## Complexity intuition

Lookup and reassignment logic depend on how the ring positions are stored, but the important algorithmic property is **small remapping on membership change**.

## Key takeaways

- The win is not faster hashing; it is **stable key placement** when the cluster changes
- Virtual nodes are a practical extension for better balance
- This topic belongs to systems DSA because it directly shapes cache and storage behavior under scaling events
- Cache eviction and consistent hashing solve different layers of caching: one local, one distributed

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Consistent hashing overview](https://en.wikipedia.org/wiki/Consistent_hashing) | 🔴 Hard | Ring-based stable remapping |
| [Dynamo paper references](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) | 🔴 Hard | Partitioning in distributed key-value systems |
| [Distributed cache references](https://memcached.org/) | 🔴 Hard | Real placement motivations |

## Relation to other topics

- **Hash Map** explains why key hashing is central in the first place
- **Cache Eviction Strategies** manage one machine's cache contents, while consistent hashing decides which machine owns a key
- **Bloom Filter & Cuckoo Filter** are often deployed alongside distributed placement to reduce unnecessary remote lookups
