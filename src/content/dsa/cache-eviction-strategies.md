---
title: "Cache Eviction Strategies (LRU, LFU, ARC, TinyLFU)"
description: "Treat cache eviction as an algorithm choice: recency, frequency, adaptation, and admission all optimize different workloads."
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

A cache with fixed capacity eventually has to answer the only question that really matters:

> when the next item arrives, which old item should leave?

That choice is not bookkeeping. It is the algorithm that determines hit rate, tail latency, and whether the cache learns the right reuse pattern from the workload.

## Intuition

A cache is trying to predict the future from the past.

Different policies use different signals:

- **recency**: if an item was used just now, it may be used again soon
- **frequency**: if an item has been used many times, it may be worth keeping even after a quiet period
- **adaptation**: workloads change, so the cache may need to rebalance how much it trusts recency vs. frequency
- **admission**: sometimes the best decision is to reject a new item instead of letting it evict something valuable

That is why LRU, LFU, ARC, and TinyLFU are not small variations of one trick. They encode different hypotheses about reuse.

## LRU: least recently used

LRU is the canonical interview and systems baseline because it has a clean `O(1)` implementation.

### Data structure

Use two structures together:

1. a **hash map** from key to node for `O(1)` lookup
2. a **doubly linked list** ordered from most-recently-used to least-recently-used

The head is the freshest item. The tail is the eviction candidate.

### Core operations

```
get(key):
    if key not in map:
        return MISS
    node <- map[key]
    remove node from its current list position
    insert node at list head
    return node.value

put(key, value):
    if key in map:
        node <- map[key]
        node.value <- value
        remove node from its current list position
        insert node at list head
        return

    if cache is full:
        victim <- list tail
        remove victim from list
        delete map[victim.key]

    node <- new node(key, value)
    insert node at list head
    map[key] <- node
```

### Worked example

Suppose capacity is 3 and the access stream is:

`A, B, C, A, D`

The recency order evolves like this:

- after `A, B, C`: `[C, B, A]`
- access `A`: move `A` to the front -> `[A, C, B]`
- insert `D`: evict tail `B` -> `[D, A, C]`

LRU does exactly what its name says: it assumes the oldest untouched entry is the safest victim.

## LFU: least frequently used

LFU keeps the items that have accumulated the strongest reuse history.

### Data structure

A practical `O(1)` LFU implementation uses:

- a hash map `key -> node`
- a hash map `frequency -> doubly linked list of nodes with that frequency`
- a variable `minFreq` storing the smallest frequency currently present

Each node stores `(key, value, freq)`.

### Core operations

```
touch(node):
    oldFreq <- node.freq
    remove node from freqList[oldFreq]
    if freqList[oldFreq] became empty and oldFreq == minFreq:
        minFreq <- minFreq + 1

    node.freq <- oldFreq + 1
    insert node at head of freqList[node.freq]

get(key):
    if key not in map:
        return MISS
    node <- map[key]
    touch(node)
    return node.value

put(key, value):
    if capacity == 0:
        return

    if key in map:
        node <- map[key]
        node.value <- value
        touch(node)
        return

    if cache is full:
        victim <- tail of freqList[minFreq]
        remove victim
        delete map[victim.key]

    node <- new node(key, value, freq = 1)
    insert node at head of freqList[1]
    map[key] <- node
    minFreq <- 1
```

When multiple items have the same frequency, most implementations break ties by recency inside each frequency bucket.

### Where LFU wins and loses

LFU can beat LRU on workloads with stable hot keys, but it can also cling to stale popularity. Something that was hot an hour ago may keep surviving even if the workload has moved on.

That is why real systems often add **aging**, **decay**, or admission logic instead of relying on pure lifetime counts forever.

## ARC and TinyLFU: advanced follow-ups

### ARC

**Adaptive Replacement Cache** tries to avoid hard-coding how much to trust recency vs. frequency.

It keeps four lists:

- `T1`: recent entries seen once
- `T2`: frequent entries seen at least twice
- `B1`: ghost history of items recently evicted from `T1`
- `B2`: ghost history of items recently evicted from `T2`

If misses keep hitting `B1`, ARC increases the space devoted to recency. If misses keep hitting `B2`, ARC shifts capacity toward frequency.

The key idea is that the ghost lists store only metadata, not values, so ARC can learn from evictions without paying full cache cost.

### TinyLFU

TinyLFU separates **admission** from **eviction**.

Instead of blindly inserting every missed item, it asks whether the new candidate is likely to be more valuable than the current victim.

A common design is **Window TinyLFU**:

1. keep a small LRU window for new arrivals
2. keep a main segmented cache for long-lived winners
3. maintain approximate frequency counts with a **Count-Min Sketch**
4. when a candidate competes with a victim, admit the candidate only if its estimated frequency is higher

```
admit(candidate, victim):
    if estimate(candidate.key) >= estimate(victim.key):
        keep candidate
    else:
        reject candidate and keep victim
```

This is why TinyLFU is so strong in real caches: one-hit wonders do not get to evict items that have already proved their value.

## Complexity and when to choose each policy

| Policy | Core structure | Lookup / update | Best when | Main weakness |
|---|---|---|---|---|
| LRU | Hash map + doubly linked list | `O(1)` | Reuse is strongly tied to recent accesses | Scans can flush genuinely valuable items |
| LFU | Hash map + frequency buckets | `O(1)` with bucket lists | Hot keys stay hot for long periods | Old popularity can become stale |
| ARC | Multiple recency/frequency lists + ghost lists | `O(1)` amortized | Workload swings between recency and frequency | More complex to implement and tune |
| TinyLFU | Cache policy + frequency sketch | `O(1)` expected | Many one-hit arrivals compete with a smaller hot working set | Needs approximate counting and more moving parts |

## Decision guide

- Pick **LRU** when you want the simplest high-performance policy and the workload has strong short-term locality.
- Pick **LFU** when long-term hot items matter more than the last few accesses.
- Pick **ARC** when you want the cache to automatically rebalance between recency and frequency.
- Pick **TinyLFU** when admission quality matters as much as eviction, especially in large service caches full of one-off traffic.

## Key takeaways

- Cache eviction is a real algorithm choice, not an afterthought on top of a hash table.
- **LRU = recency**, **LFU = frequency**, **ARC = adaptive recency/frequency**, **TinyLFU = admission-aware frequency filtering**.
- The classic LRU implementation is **hash map + doubly linked list**, which is why it shows up so often in interviews.
- LFU needs more machinery because it must update both key lookup and frequency ordering on every hit.
- TinyLFU explains why sketches like **Count-Min Sketch** matter: approximate counting can improve a very practical systems decision.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [LRU Cache](https://leetcode.com/problems/lru-cache/) | Medium | Hash map plus doubly linked list for `O(1)` get and put |
| [LFU Cache](https://leetcode.com/problems/lfu-cache/) | Hard | Frequency buckets plus recency tie-breaking |
| [ARC paper](https://www.usenix.org/conference/fast-03/arc-self-tuning-low-overhead-replacement-cache) | Hard | Adaptive recency vs. frequency |
| [TinyLFU paper](https://arxiv.org/abs/1512.00727) | Hard | Admission by approximate frequency instead of blind insertion |

## Relation to other topics

- **Hash Map** gives the `O(1)` key lookup every practical cache implementation needs.
- **Linked List** supports LRU-style recency ordering with constant-time remove and insert.
- **Count-Min Sketch** often appears inside TinyLFU-style admission logic.
- **Consistent Hashing** decides which machine owns a key, while cache eviction decides what survives inside one machine's local cache.
