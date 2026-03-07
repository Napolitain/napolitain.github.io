---
title: "Manacher"
description: "Find the longest palindromic substring in linear time by reusing information from the rightmost known palindrome."
date: 2026-03-07
tags: ["string", "palindrome", "rare"]
draft: false
visualization: "ManacherVisualization"
family: "string"
kind: "algorithm"
difficulty: "advanced"
prerequisites: []
related: ["rabin-karp", "z-algorithm", "suffix-automaton"]
enables: []
---

## Problem

You want the longest palindromic substring, or the palindrome radius around every center.

A naive expand-around-center solution takes $O(n^2)$ in the worst case. Manacher reduces that to linear time.

## Core idea

Insert separators so even- and odd-length palindromes become one uniform case, then maintain the rightmost palindrome seen so far.

For a new center `i` inside that known palindrome, use its mirror position to get a guaranteed initial radius before doing any explicit comparisons.

That reuse is what kills the quadratic blowup.

## Why it matters

Manacher is one of the classic "looks magical until you see the invariant" algorithms.

It teaches a powerful pattern:

> once a symmetric region is known, interior positions can borrow information from mirrored positions

## Complexity

| Operation | Time |
|---|---|
| All palindrome radii / longest palindromic substring | $O(n)$ |

## Key takeaways

- Manacher is the linear-time answer to longest palindromic substring
- The transformed string removes the even/odd split
- The mirror trick reuses previously known palindrome coverage
- This is a rare string algorithm, but it belongs in a truly complete atlas

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/) | 🟡 Medium | Manacher or center expansion |
| [Palindromic Substrings](https://leetcode.com/problems/palindromic-substrings/) | 🟡 Medium | Count via radius information |
| [Manacher references](https://cp-algorithms.com/string/manacher.html) | 🔴 Hard | Full linear-time derivation |

## Relation to other topics

- **Z-Algorithm** is another linear string routine based on reusing a rightmost interval
- **Rabin-Karp** can also test palindrome candidates, but through hashing instead of direct radius reuse
- **Suffix Automaton** is another advanced string structure for substring-heavy problems
