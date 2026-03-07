---
title: "Suffix Automaton"
description: "Compress all substrings of a string into a linear-size automaton with suffix links."
date: 2026-03-07
tags: ["string", "automaton", "rare"]
draft: false
visualization: "SuffixAutomatonVisualization"
family: "string"
kind: "data-structure"
difficulty: "advanced"
prerequisites: []
related: ["suffix-array", "aho-corasick", "manacher"]
enables: []
---

## Problem

You want a structure that captures all substrings of one string and supports rich substring analytics.

## Core idea

A suffix automaton is the minimal DFA that recognizes all substrings of a string.

As you append characters one by one, you maintain states representing sets of end positions. Each state stores:

- its longest represented substring length
- a suffix link to the next smaller context
- transitions by characters

## Why it matters

Suffix automata are powerful because they encode a huge amount of substring information in only linear space.

They support tasks like:

- counting distinct substrings
- finding longest common substrings
- tracing occurrence structure

## Complexity

| Operation | Time |
|---|---|
| Build automaton | $O(n)$ |

Many follow-up analyses remain linear or near-linear once the automaton exists.

## Key takeaways

- A suffix automaton is a compact substring machine
- Suffix links are the main structural idea; they point to the next smaller suffix context
- This structure is more compact and automaton-flavored than suffix arrays or tries
- It is rare advanced string material, but it belongs in the same serious toolbox tier

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Distinct Substrings references](https://cp-algorithms.com/string/suffix-automaton.html) | 🔴 Hard | Count substrings via state lengths |
| [Longest Common Substring references](https://cp-algorithms.com/string/suffix-automaton.html#longest-common-substring-of-two-strings) | 🔴 Hard | Walk another string through the automaton |
| [String analytics references](https://usaco.guide/adv/string-suffix?lang=cpp) | 🔴 Hard | State transitions and suffix links |

## Relation to other topics

- **Suffix Array** indexes suffix order; suffix automaton indexes substring state transitions
- **Aho-Corasick** is another automaton, but for many patterns rather than all substrings of one text
- **Manacher** focuses specifically on palindromes, not general substring structure
