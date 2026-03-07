---
title: "Aho-Corasick"
description: "Match many patterns in one pass by augmenting a trie with failure links. This is multi-pattern search done at scale."
date: 2026-03-07
tags: ["string", "trie", "pattern-matching", "rare"]
draft: false
visualization: "AhoCorasickVisualization"
family: "string"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["trie"]
related: ["kmp", "z-algorithm"]
enables: []
---

## Problem

You have many patterns and one big text.

Examples:

- a blocklist of forbidden words
- many DNA motifs
- many keywords to detect in a document stream

Running KMP or a naive scan for every pattern separately is too expensive. You want one pass over the text to find **all** matches.

## Core idea

Start with a trie containing every pattern.

Then add **failure links**:

- if the current edge does not exist
- jump to the longest proper suffix that is also a trie prefix
- continue from there instead of restarting from the root manually

This makes the trie behave like a finite automaton for many strings at once.

## Why it is powerful

Each character of the text is processed once through a sequence of trie moves and occasional failure jumps. The fallback work is amortized, so the whole scan stays linear in the text length plus the number of matches.

That is the big win:

> many patterns, one automaton, one scan

## Construction outline

1. insert every pattern into a trie
2. perform a BFS over trie nodes
3. compute a failure link for each node
4. propagate output information so suffix matches are also reported

The BFS step is what turns the trie into the final matcher.

## Complexity

If the total pattern length is $M$ and the text length is $N$:

| Phase | Time |
|---|---|
| Build trie + failure links | $O(M)$ or $O(M \cdot alphabet)$ depending on implementation |
| Scan text | $O(N + matches)$ |

## When to use it

Use Aho-Corasick when:

- there are many patterns
- the text is large or streamed
- you need every occurrence, not just one pattern at a time

It is uncommon in everyday interview prep, but very important in real systems like filters, lexers, intrusion detection, and bioinformatics pipelines.

## Key takeaways

- Aho-Corasick is a **trie plus failure links**
- It is the standard answer to multi-pattern matching
- BFS is part of the construction, which is a nice cross-family connection: string matching built with trie structure and graph-style traversal
- This is rare for beginner curricula, but it belongs in a serious string toolbox

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Stream of Characters](https://leetcode.com/problems/stream-of-characters/) | 🔴 Hard | Trie-style streaming queries, close in spirit to Aho-Corasick |
| [Aho-Corasick overview](https://cp-algorithms.com/string/aho_corasick.html) | 🔴 Hard | Build failure links and output transitions |
| [Keyword Search references](https://www.geeksforgeeks.org/aho-corasick-algorithm-pattern-searching/) | 🔴 Hard | Multi-pattern text scanning |

## Relation to other topics

- **Trie** is the base structure that stores all patterns together
- **BFS** often appears in the construction phase for failure links
- This is the natural “what comes next” topic after someone understands tries well
