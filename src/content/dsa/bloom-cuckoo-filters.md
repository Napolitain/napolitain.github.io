---
title: "Bloom Filter & Cuckoo Filter"
description: "Use tiny approximate membership structures to rule out absent keys cheaply before touching slower storage or larger indexes."
date: 2026-03-07
tags: ["filter", "membership", "probabilistic", "rare"]
draft: false
visualization: "BloomCuckooVisualization"
family: "probabilistic"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["hash-map"]
related: ["lsm-tree", "count-min-sketch", "hyperloglog"]
enables: []
---

## Problem

Sometimes you do not need an exact set membership structure. You just need a tiny, fast guard that can answer:

> is this key definitely absent, or only maybe present?

That is enough to skip expensive disk reads, remote calls, or larger data-structure lookups.

## Bloom filter

A Bloom filter stores a bit array plus multiple hash functions.

To insert a key, hash it several ways and set those bit positions to 1.

To query a key:

- if any required bit is 0, the key is definitely absent
- if all are 1, the key is *possibly* present

That means:

- **false negatives:** impossible
- **false positives:** possible

## Cuckoo filter

A Cuckoo filter stores short fingerprints in one of two candidate buckets.

Compared with a Bloom filter, a Cuckoo filter usually shines when you need:

- deletions
- a compact dynamic structure
- similar membership-filter behavior with more flexibility

## Why they matter

These filters are classic systems tools because they sit in front of slower layers:

- storage engines use them to skip SSTables
- caches use them to avoid expensive misses
- distributed systems use them to prune work cheaply

## Complexity

Membership checks and insertions are typically constant expected time, with memory usage far smaller than exact hash tables.

## Key takeaways

- Bloom and Cuckoo filters answer **approximate membership**, not exact lookup
- Bloom filters are simpler; Cuckoo filters are often better when deletions matter
- The main systems value is avoiding unnecessary expensive work downstream
- This is specialized systems material, but extremely practical in real databases and caches

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Bloom filter overview](https://en.wikipedia.org/wiki/Bloom_filter) | 🔴 Hard | Bit-array membership approximation |
| [Cuckoo filter paper summary](https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf) | 🔴 Hard | Fingerprints plus relocations |
| [LSM filter notes](https://rocksdb.org/blog/2021/12/29/ribbon-filter.html) | 🔴 Hard | Why storage engines care about negative checks |

## Relation to other topics

- **Hash Map** explains why hashing can stand in for full key storage
- **LSM Tree** often uses Bloom filters to avoid pointless SSTable probes
- **Count-Min Sketch** and **HyperLogLog** are sibling probabilistic structures, but they estimate frequency and cardinality rather than membership
