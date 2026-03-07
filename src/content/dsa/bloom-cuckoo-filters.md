---
title: "Bloom Filter & Cuckoo Filter"
description: "Use tiny approximate membership structures to reject absent keys cheaply before touching slower storage or larger indexes."
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

Sometimes you do not need an exact set. You need a tiny front-line guard that can answer:

> is this key definitely absent, or do I need to check the expensive structure behind it?

That is enough to skip disk reads, remote calls, SSTable probes, or cache misses that would otherwise dominate the cost.

## Intuition

Approximate membership structures trade exactness for space.

They are designed so a negative answer is very informative:

- **Bloom filter**: "definitely not present" or "maybe present"
- **Cuckoo filter**: same style of answer, but with better support for deletions

The key systems value is not the final answer. It is the expensive work you avoid after a negative check.

## Bloom filter

A Bloom filter stores:

- a bit array of length `m`
- `k` hash functions

### Insert

```
insert(x):
    for i in 1 .. k:
        bit[h_i(x) mod m] <- 1
```

### Query

```
contains(x):
    for i in 1 .. k:
        if bit[h_i(x) mod m] == 0:
            return DEFINITELY_ABSENT
    return MAYBE_PRESENT
```

### What errors are possible?

- **false negatives**: impossible
- **false positives**: possible

A query can look present because unrelated keys happened to set the same bits.

### Choosing `k`

If you expect `n` inserts into `m` bits, a standard choice is:

$$
 k \approx \frac{m}{n} \ln 2
$$

And the false-positive rate is approximately:

$$
\left(1 - e^{-kn/m}\right)^k
$$

So more bits per key reduce false positives, but the structure remains approximate.

## Cuckoo filter

A Cuckoo filter stores short **fingerprints** inside small buckets instead of setting many global bits.

For a key `x`:

- compute fingerprint `f`
- compute first bucket `i1 = hash(x)`
- compute second bucket `i2 = i1 XOR hash(f)`

The fingerprint can live in either bucket.

### Query

```
contains(x):
    f <- fingerprint(x)
    i1 <- hash(x) mod numBuckets
    i2 <- i1 XOR hash(f)
    if f is in bucket[i1] or bucket[i2]:
        return MAYBE_PRESENT
    return DEFINITELY_ABSENT
```

### Insert

```
insert(x):
    f <- fingerprint(x)
    i1 <- hash(x) mod numBuckets
    i2 <- i1 XOR hash(f)

    if bucket[i1] or bucket[i2] has space:
        place f there
        return SUCCESS

    i <- random choice of i1 or i2
    for kick in 1 .. MAX_KICKS:
        swap f with a random fingerprint in bucket[i]
        i <- i XOR hash(f)
        if bucket[i] has space:
            place f there
            return SUCCESS

    return REBUILD_NEEDED
```

### Delete

```
delete(x):
    f <- fingerprint(x)
    remove f from bucket[i1] or bucket[i2] if present
```

That delete support is one of the biggest practical differences from plain Bloom filters.

## Worked example

Imagine an LSM tree with hundreds of SSTables.

Before touching an SSTable for key `invoice:42`, the engine asks a membership filter whether the SSTable could possibly contain the key.

- if the filter says **definitely absent**, that SSTable is skipped immediately
- if the filter says **maybe present**, the engine performs the slower lookup

Even a modest false-positive rate is acceptable because the filter's job is to eliminate most misses cheaply.

## Complexity

| Structure | Insert | Query | Delete | Space style |
|---|---|---|---|---|
| Bloom filter | `O(k)` | `O(k)` | not supported in plain Bloom filter | Bit array |
| Cuckoo filter | expected `O(1)` | expected `O(1)` | expected `O(1)` | Buckets of short fingerprints |

Cuckoo insertion can occasionally fail after many displacements, which triggers a rebuild or resize.

## Bloom vs. Cuckoo: when to choose which

| Question | Bloom filter | Cuckoo filter |
|---|---|---|
| Simplest implementation? | Yes | No |
| Deletions needed? | No, unless using a counting Bloom variant | Yes |
| Excellent negative checks? | Yes | Yes |
| Operational model | Set bits with `k` hashes | Place fingerprints in two candidate buckets |
| Common use | SSTable filters, network filters, one-way membership tests | Dynamic membership filters where deletion matters |

## Key takeaways

- Bloom and Cuckoo filters solve **approximate membership**, not exact lookup.
- The main payoff is avoiding slower downstream work, not replacing the real storage layer.
- Bloom filters are simpler and have one-sided error: false positives but no false negatives.
- Cuckoo filters use fingerprints and relocations so they can support deletion while staying compact.
- These filters belong naturally next to LSM trees, caches, and distributed systems because those systems constantly benefit from cheap negative checks.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Bloom filter overview](https://en.wikipedia.org/wiki/Bloom_filter) | Hard | Bit-array membership approximation |
| [Cuckoo filter paper](https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf) | Hard | Fingerprints plus relocations |
| [RocksDB filter notes](https://rocksdb.org/blog/2021/12/29/ribbon-filter.html) | Hard | Why storage engines care so much about negative checks |

## Relation to other topics

- **LSM Tree** often uses Bloom-style filters to skip SSTables cheaply on misses.
- **Count-Min Sketch** and **HyperLogLog** are sibling sketches, but they estimate frequency and cardinality rather than membership.
- **Hash Map** explains why hashing can stand in for full key storage when approximation is acceptable.
