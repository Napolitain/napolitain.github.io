---
title: "Consistent Hashing"
description: "Map keys onto a ring so cluster membership changes move only nearby keys instead of reshuffling the whole keyspace."
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

If you place keys with `hash(key) % n`, changing `n` remaps almost everything.

That is fine for one process, but terrible for distributed caches and sharded storage. Adding one server should not invalidate the entire cluster's placement map.

## Intuition

Consistent hashing replaces the linear bucket range with a **ring**.

- hash every server onto the ring
- hash every key onto the same ring
- assign the key to the first server encountered while walking clockwise

Now a server owns only the interval immediately before its ring position. When a new server appears, it steals only that interval instead of forcing a global reshuffle.

## Data structure model

A typical implementation stores the server positions in a sorted structure:

- sorted array + binary search
- balanced tree / ordered map
- skip list or B-tree-like ordered index

Real systems also use **virtual nodes**: each physical server is hashed to many ring positions.

That smooths imbalance because a server no longer owns one giant interval. It owns many smaller intervals scattered around the ring.

## Core operations

### Lookup

```
owner(key):
    pos <- hash(key)
    i <- lower_bound(ringPositions, pos)
    if i exists:
        return ringPositions[i].server
    return ringPositions[0].server    // wrap around the ring
```

The only algorithmic requirement is an ordered search for the first server clockwise from the key.

### Add a server

```
add_server(server, replicas):
    for r in 1 .. replicas:
        pos <- hash(server.id || "#" || r)
        insert (pos, server) into ordered ring
```

Each inserted virtual node steals only the interval between its predecessor and itself.

### Remove a server

```
remove_server(server):
    remove all virtual-node positions belonging to server
```

The keys in those intervals fall through to the next clockwise server.

## Worked example

Assume the ring positions are:

- `A` at 20
- `B` at 60
- `C` at 85

Then the ownership intervals are:

- `(85, 20] -> A`
- `(20, 60] -> B`
- `(60, 85] -> C`

So:

- key hash 10 -> `A`
- key hash 42 -> `B`
- key hash 74 -> `C`
- key hash 91 -> wrap -> `A`

Now add `D` at 70.

Only the interval `(60, 70]` moves from `C` to `D`. Keys elsewhere stay put. That local movement is the entire point of the technique.

## Why virtual nodes matter

Without virtual nodes, one unlucky server hash can own a huge fraction of the ring.

With `R` virtual nodes per machine:

- load balances more evenly
- adding one physical machine introduces many small ownership changes instead of one large cliff
- replicas and heterogeneous capacity become easier to express

A bigger machine can simply receive more virtual nodes.

## Complexity

Assume there are `V` virtual nodes total.

| Operation | Time | Notes |
|---|---|---|
| Lookup | `O(log V)` | Binary search in a sorted ring |
| Add one physical server with `R` virtual nodes | `O(R log V)` | Insert `R` ordered positions |
| Remove one physical server with `R` virtual nodes | `O(R log V)` | Delete its ordered positions |
| Key remapping on topology change | proportional to affected intervals | Only nearby keys move |

The asymptotic lookup cost is not the main win. The real win is **minimal remapping under membership change**.

## Consistent hashing vs. modulo hashing

| Scheme | Lookup rule | What happens when a server changes? |
|---|---|---|
| `hash(key) % n` | Direct modulo bucket | Nearly every key can move |
| Consistent hashing | First clockwise server on a ring | Only keys in nearby intervals move |

Modulo hashing is simpler. Consistent hashing is the right choice when stability under scaling events matters more than trivial implementation.

## Key takeaways

- Consistent hashing is about **stable placement**, not faster hashing.
- The algorithm needs an **ordered ring of server positions** and a **clockwise owner rule**.
- **Virtual nodes** are what make the technique robust in real systems.
- Only a small region of keys moves when a node joins or leaves, which is why caches and sharded stores rely on it.
- Cache eviction and consistent hashing solve different problems: one chooses the local victim, the other chooses the owning machine.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Consistent hashing overview](https://en.wikipedia.org/wiki/Consistent_hashing) | Hard | Ring-based stable remapping |
| [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) | Hard | Partitioning and virtual nodes in a production key-value store |
| [Memcached client hashing notes](https://github.com/memcached/memcached/wiki/ClientCompatibility) | Hard | Why distributed caches care about remapping behavior |

## Relation to other topics

- **Hash Map** gives the single-machine hashing intuition that consistent hashing generalizes to a cluster.
- **Cache Eviction Strategies** decide what stays in one node's cache once consistent hashing has placed the key there.
- **Bloom Filter & Cuckoo Filter** are often paired with distributed placement to avoid useless downstream probes.
