---
title: "Hash Map"
description: "O(1) average-case lookups via hashing. Understand collision resolution, load factors, and when hash maps are the right (or wrong) choice."
date: 2026-03-06
tags: ["hash-map", "hash-table", "array"]
draft: false
visualization: "HashMapVisualization"
---

## Problem

You have $n$ elements. You need to insert, lookup, and delete by key — not by position. A sorted array gives you $O(\log n)$ search via binary search, but $O(n)$ insertion. A linked list gives $O(1)$ insertion but $O(n)$ search. A hash map gives you $O(1)$ average for all three. That's the entire point.

## Intuition

A hash map is an array where the index is computed from the key. A **hash function** $h(k)$ maps an arbitrary key $k$ to an integer, and you use $h(k) \bmod m$ (where $m$ is the array size) as the bucket index. Two different keys can hash to the same index — that's a **collision**, and you need a strategy to handle it.

## Hash functions

A good hash function has three properties:

1. **Deterministic** — same key always produces the same hash
2. **Uniform distribution** — outputs spread evenly across the range, minimizing collisions
3. **Fast** — the whole point is $O(1)$, a slow hash defeats the purpose

For strings, a common approach is polynomial rolling hash:

$$h(s) = \sum_{i=0}^{n-1} s[i] \cdot p^i \mod m$$

where $p$ is a prime (31 or 37 work well for lowercase ASCII). For integers, a common approach is $h(k) = k \cdot \text{large\_prime} \mod m$.

## Collision resolution

### Separate chaining

Each bucket stores a linked list. On collision, append to the list.

```
put(key, value):
    idx ← hash(key) mod m
    for each (k, v) in table[idx]:
        if k == key:
            update v to value
            return
    append (key, value) to table[idx]
    size++

get(key):
    idx ← hash(key) mod m
    for each (k, v) in table[idx]:
        if k == key:
            return v
    return NOT_FOUND
```

Simple, works well when load factor stays reasonable. Worst case: every key hashes to the same bucket → $O(n)$ linked list traversal.

### Open addressing

No linked lists — everything lives in the array. On collision, probe for the next empty slot.

```
put(key, value):
    idx ← hash(key) mod m
    while table[idx] is occupied:
        if table[idx].key == key:
            update value
            return
        idx ← (idx + probe(i)) mod m    // i = attempt number
    table[idx] ← (key, value)
    size++
```

**Linear probing**: $\text{probe}(i) = i$. Simple but causes **clustering** — occupied slots clump together, degrading performance.

**Quadratic probing**: $\text{probe}(i) = i^2$. Reduces primary clustering but can fail to find empty slots if the table is too full.

**Double hashing**: $\text{probe}(i) = i \cdot h_2(k)$ where $h_2$ is a second hash function. Best distribution, but more expensive per probe.

## Load factor and resizing

The **load factor** $\alpha = \frac{n}{m}$ (elements / buckets) determines performance. For separate chaining, average chain length is $\alpha$. For open addressing, expected probes approach $\frac{1}{1 - \alpha}$ as $\alpha \to 1$.

Most implementations resize (typically double $m$) when $\alpha$ exceeds a threshold — 0.75 is the classic default (Java's `HashMap`). Resizing means **rehashing**: allocate a new array of size $2m$, recompute $h(k) \bmod 2m$ for every existing entry, and reinsert. This is $O(n)$ but happens rarely enough that insertion remains **amortized** $O(1)$.

## Common patterns

**Two-sum**: store each number's complement in a hash map as you iterate. $O(n)$ time, $O(n)$ space.

**Frequency counting**: count occurrences of each element. Foundation for group-anagrams (sorted string → key), majority element, top-k.

**Two-pass pattern**: first pass builds the map, second pass queries it. Avoids nested loops.

**LRU cache**: hash map (for $O(1)$ lookup) + doubly linked list (for $O(1)$ eviction order). The combination gives $O(1)$ for both `get` and `put`.

## When hash maps fail

**Worst case is $O(n)$**. If all keys collide, you degrade to a linked list. Java 8+ mitigates this by converting long chains to balanced trees ($O(\log n)$ worst case).

**Hash flooding attacks**: an adversary crafts keys that all hash to the same bucket, turning your $O(1)$ server into $O(n^2)$. Mitigation: use randomized hash functions (SipHash) or keyed hashes.

**No ordering**: hash maps don't maintain insertion order or sorted order (unless you use a `LinkedHashMap` or `TreeMap` variant). If you need range queries or sorted iteration, use a balanced BST instead.

**Memory overhead**: each entry carries key + value + pointer/metadata. For small keys, the overhead ratio is significant.

## Complexity

| Operation | Average | Worst case |
|---|---|---|
| Insert | $O(1)$ | $O(n)$ |
| Lookup | $O(1)$ | $O(n)$ |
| Delete | $O(1)$ | $O(n)$ |
| Space | $O(n)$ | $O(n)$ |
| Resize | $O(n)$ | $O(n)$ |

Worst case occurs when all keys hash to the same bucket. With a good hash function and reasonable load factor, you stay firmly in $O(1)$ territory.

## Relation to other structures

**Hash set**: a hash map where you only store keys (no values). Same mechanics, same complexity.

**Bloom filter**: a probabilistic hash set. Uses $k$ hash functions and a bit array. Can tell you "definitely not in set" or "probably in set" — no false negatives, but false positives. Much more space-efficient than a hash set when approximate membership is acceptable.

**Consistent hashing**: distributes keys across nodes in a distributed system. When a node joins or leaves, only $\frac{1}{n}$ of keys need remapping (vs. rehashing everything). Used in distributed caches (Memcached, DynamoDB).
