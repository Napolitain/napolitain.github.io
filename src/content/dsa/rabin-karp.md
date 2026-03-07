---
title: "Rabin-Karp"
description: "Search with rolling hashes so most windows can be rejected with arithmetic instead of full character comparisons."
date: 2026-03-07
tags: ["string", "rolling-hash", "pattern-matching"]
draft: false
visualization: "RabinKarpVisualization"
family: "string"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: []
related: ["kmp", "z-algorithm", "suffix-array"]
enables: ["suffix-array"]
---

## Problem

You want to search for a pattern inside a text, but instead of building a prefix table like KMP, you want a method based on hashing.

## Core idea

Treat a string window as a number modulo some base and modulus. As the window slides:

- remove the contribution of the outgoing character
- multiply / shift the remaining hash
- add the incoming character

That gives a **rolling hash**.

If the window hash does not equal the pattern hash, the window cannot match. Only when the hashes agree do you verify characters directly.

## Why it matters

Rabin-Karp is valuable because it teaches string matching from the hashing angle instead of the prefix-function angle.

It is especially natural when:

- you search many windows of the same length
- you compare substrings quickly
- you combine hashing with binary search or suffix structures

## Complexity

| Operation | Time |
|---|---|
| Search | Expected $O(n + m)$ with low collision rate |

Worst case can degrade if collisions are adversarial, which is why practical implementations use large moduli or double hashing.

## Key takeaways

- Rabin-Karp is about fast rejection by rolling hash
- Hash equality is a candidate signal, not a proof, unless the scheme is collision-free in context
- It complements KMP and Z rather than replacing them
- This is an important non-rare string tool because hashing shows up everywhere else too

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/) | 🟡 Medium | Rolling hash over fixed-length windows |
| [Find Substring With Given Hash Value](https://leetcode.com/problems/find-substring-with-given-hash-value/) | 🔴 Hard | Explicit rolling-hash mechanics |
| [Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/) | 🔴 Hard | Binary search plus substring hashing |

## Relation to other topics

- **KMP** and **Z-Algorithm** solve pattern matching via prefix reuse instead of hashing
- **Suffix Array** often pairs with hashing for substring comparison tricks
- **Hash Map** ideas help explain why hashed string fingerprints can be useful at all
