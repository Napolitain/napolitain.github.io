---
title: "KMP (Knuth-Morris-Pratt)"
description: "Search for a pattern in linear time by reusing information about its own prefixes instead of restarting after mismatches."
date: 2026-03-07
tags: ["string", "pattern-matching", "prefix-function", "kmp"]
draft: false
visualization: "KmpVisualization"
family: "string"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: []
related: ["z-algorithm", "aho-corasick", "rabin-karp", "suffix-array"]
enables: ["aho-corasick", "suffix-array"]
---

## Problem

You need to find a pattern inside a text.

The naive approach restarts from scratch after every mismatch, which can lead to repeated work. KMP avoids that waste.

## Core idea

Precompute the **longest proper prefix which is also a suffix** for every pattern prefix.

This array is often called:

- `lps`
- prefix function
- failure function

When a mismatch happens after matching `j` characters, KMP does **not** restart at `j = 0` immediately. It jumps to `lps[j - 1]` and reuses what the pattern already knows about itself.

## Why it works

Suppose you matched `abab` and then fail on the next character.

You already know the suffix `ab` is also a prefix of `abab`, so there is no reason to re-check those characters from scratch. KMP folds that fact into the prefix table.

## Prefix table build

```
lps[0] <- 0
j <- 0

for i in 1..m-1:
    while j > 0 and pattern[i] != pattern[j]:
        j <- lps[j - 1]
    if pattern[i] == pattern[j]:
        j <- j + 1
    lps[i] <- j
```

## Search

```
j <- 0
for i in 0..n-1:
    while j > 0 and text[i] != pattern[j]:
        j <- lps[j - 1]
    if text[i] == pattern[j]:
        j <- j + 1
    if j == m:
        report match
        j <- lps[j - 1]
```

## Complexity

| Phase | Time |
|---|---|
| Build prefix table | $O(m)$ |
| Search text | $O(n)$ |

Overall: $O(n + m)$.

## Why it matters

KMP is a foundational string algorithm because it teaches a major pattern:

> preprocess the pattern so mismatches become structured jumps instead of blind restarts

That same idea shows up again in Z-algorithm and Aho-Corasick.

## Key takeaways

- KMP turns repeated restarts into controlled prefix-table jumps
- The `lps` array captures self-similarity inside the pattern
- It is a classic linear-time single-pattern matcher
- Even when you do not implement KMP directly, understanding it sharpens how you think about string reuse

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Find the Index of the First Occurrence in a String](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/) | 🟡 Medium | KMP is a linear-time solution |
| [Repeated Substring Pattern](https://leetcode.com/problems/repeated-substring-pattern/) | 🟡 Medium | Prefix-function reasoning |
| [Longest Happy Prefix](https://leetcode.com/problems/longest-happy-prefix/) | 🔴 Hard | Direct use of prefix table |

## Relation to other topics

- **Z-Algorithm** solves a similar prefix-reuse problem with a different table
- **Aho-Corasick** generalizes failure-style jumps from one pattern to many patterns
