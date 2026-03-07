---
title: "Z-Algorithm"
description: "Compute how much of the global prefix matches at every position, then reuse the active Z-box to stay linear."
date: 2026-03-07
tags: ["string", "pattern-matching", "z-algorithm", "prefix"]
draft: false
visualization: "ZAlgorithmVisualization"
family: "string"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: []
related: ["kmp", "aho-corasick", "rabin-karp", "manacher", "suffix-array"]
enables: ["manacher"]
---

## Problem

You want to know, for every index `i`, how many characters starting at `i` match the prefix of the string.

That array of answers is called the **Z-array**.

It is useful on its own, and it also gives a clean route to pattern matching.

## Core idea

Maintain the current interval `[L, R]` whose substring matches the prefix.

When processing a new index `i`:

- if `i` is outside the box, match characters directly
- if `i` is inside the box, reuse earlier Z-values to skip work
- extend the box only when necessary

That reuse is why the algorithm stays linear.

## Why it matters

KMP stores prefix/suffix overlap for pattern prefixes. Z-algorithm stores prefix-match length for every position.

They solve related problems from different angles:

- KMP is centered on mismatch fallback during search
- Z is centered on prefix matching over the whole string

Both are important because they teach the same broader lesson: string structure can replace repeated character-by-character restarts.

## Pattern matching trick

To search for pattern `P` inside text `T`, build:

$$
S = P + \# + T
$$

Then compute the Z-array of `S`.

Any position where `Z[i] = |P|` corresponds to an occurrence of the pattern in the text.

## Complexity

| Operation | Time |
|---|---|
| Build Z-array | $O(n)$ |

## Key takeaways

- Z-array tells you how strongly every suffix prefix-aligns with the whole string
- The Z-box `[L, R]` is the reuse mechanism that keeps the algorithm linear
- Z-algorithm is a serious core string tool, not just a contest trick
- KMP and Z are worth learning together because each clarifies the other

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Find Beautiful Indices in the Given Array I](https://leetcode.com/problems/find-beautiful-indices-in-the-given-array-i/) | 🟡 Medium | String occurrence detection and prefix reuse |
| [String Matching with Z-function references](https://cp-algorithms.com/string/z-function.html) | 🔴 Hard | Direct Z-array construction |
| [Pattern matching notes](https://usaco.guide/adv/string-search?lang=cpp) | 🔴 Hard | Compare KMP and Z-based matching |

## Relation to other topics

- **KMP** captures a similar prefix-reuse idea in a fallback table
- **Aho-Corasick** generalizes structured fallback to many patterns at once
