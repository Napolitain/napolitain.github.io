---
title: "Suffix Array"
description: "Sort all suffixes of a string once, then answer many substring questions by binary searching the sorted order."
date: 2026-03-07
tags: ["string", "suffix-array", "rare"]
draft: false
visualization: "SuffixArrayVisualization"
family: "string"
kind: "data-structure"
difficulty: "advanced"
prerequisites: ["binary-search"]
related: ["rabin-karp", "suffix-automaton", "z-algorithm"]
enables: []
---

## Problem

You want fast substring search, lexicographic suffix ordering, or range-style questions over all suffixes of one string.

## Core idea

Build an array of suffix starting positions and sort them by the suffix text.

If the suffixes are in lexicographic order, then all occurrences of a pattern correspond to a contiguous binary-search range in that order.

That is the big win: expensive substring reasoning becomes order queries over integers.

## Why it matters

Suffix arrays are one of the canonical advanced string structures because they turn one string into an indexed search space.

They pair naturally with:

- binary search for pattern lookup
- LCP arrays for common-prefix structure
- offline substring ordering tasks

## Complexity

Construction depends on the method used, but the high-level query story is:

| Operation | Time |
|---|---|
| Pattern existence query | $O(m \log n)$ without extra LCP acceleration |

## Key takeaways

- A suffix array is just the sorted order of all suffixes
- Binary search over that order solves many substring existence queries
- LCP information is what upgrades suffix arrays from good to extremely powerful
- This is rare advanced string material, but it is one of the major classic structures

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Substring Order references](https://cp-algorithms.com/string/suffix-array.html) | 🔴 Hard | Sorting suffixes plus LCP |
| [String Matching](https://cses.fi/problemset/task/1753/) | 🔴 Hard | Query patterns against suffix structure |
| [Repeated Substring references](https://usaco.guide/adv/suffix-arrays) | 🔴 Hard | LCP-driven reasoning |

## Relation to other topics

- **Binary Search** is the query mechanism over suffix ranks
- **Rabin-Karp** offers a hashing-based alternative for substring comparison tasks
- **Suffix Automaton** is another advanced structure for substring-heavy problems, with a very different shape
