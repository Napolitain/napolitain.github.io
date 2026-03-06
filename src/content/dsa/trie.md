---
title: "Trie (Prefix Tree)"
description: "A tree-like data structure for efficient string storage and prefix-based retrieval. Essential for autocomplete, spell checking, and word search problems."
date: 2026-03-06
tags: ["trie", "string", "tree", "prefix"]
draft: false
visualization: "TrieVisualization"
---

## Problem

Given a set of strings, you need to efficiently insert words, check if a word exists, and query all words that share a common prefix. Hash sets can check membership in $O(1)$ amortized, but they can't answer prefix queries without scanning every key. You need a structure where prefix lookups are first-class operations.

## Intuition

A trie is a tree where each edge represents a single character and each path from root to a marked node spells out a word. Think of it like a phone book organized not alphabetically by full name, but character by character — you narrow down candidates with every letter you type. The root is the empty string. Every node implicitly represents the prefix formed by the path from the root to that node.

The key insight: words that share a prefix share the same path in the trie. "cat", "car", and "card" all traverse root → c → a, then diverge. This shared structure is what makes prefix operations efficient — you don't re-examine characters you've already matched.

## Algorithm

```
Insert(word):
    node ← root
    for char in word:
        if char not in node.children:
            node.children[char] ← new TrieNode()
        node ← node.children[char]
    node.isEnd ← true

Search(word):
    node ← root
    for char in word:
        if char not in node.children:
            return false
        node ← node.children[char]
    return node.isEnd

StartsWith(prefix):
    node ← root
    for char in prefix:
        if char not in node.children:
            return false
        node ← node.children[char]
    return true

Delete(word):
    // Recursive: walk to end, remove isEnd flag,
    // then backtrack deleting nodes with no children and no isEnd
```

## Implementation details

A `TrieNode` holds a `children` mapping and an `isEnd` boolean. The two standard implementations for `children`:

| Approach | Lookup | Memory per node | When to use |
|---|---|---|---|
| Array of size 26 | $O(1)$ | Fixed 26 pointers | Lowercase English only, speed critical |
| Hash map | $O(1)$ avg | Proportional to actual children | Unicode, sparse alphabets, general purpose |

The array approach wastes memory when most slots are `null` but gives cache-friendly constant-time access. The hash map approach is more flexible and memory-efficient for large or variable alphabets. In practice, for interview problems with lowercase English, use the array. For production systems, use a hash map.

You can also store a `count` field on each node to track how many words pass through it — useful for prefix counting without traversal.

## Common patterns

**Autocomplete.** Walk the trie to the prefix node, then DFS from there to collect all words. This is $O(P + K)$ where $P$ is prefix length and $K$ is the total characters in all matching words.

**Word search on a board.** Build a trie from the dictionary, then DFS on the grid while simultaneously walking the trie. The trie lets you prune branches early — if no word starts with the current path, stop. This is the standard approach for Leetcode 212.

**Longest common prefix.** Insert all strings, then walk from the root following only-child nodes until you hit a fork or an end-of-word marker. The depth at that point is your answer.

**Counting distinct substrings.** Insert all suffixes of a string into a trie. The number of nodes (excluding root) equals the number of distinct substrings.

## When to use Trie vs other structures

| Structure | Membership | Prefix query | Ordered iteration | Space |
|---|---|---|---|---|
| Hash set | $O(L)$ avg | ✗ | ✗ | $O(N \cdot L)$ |
| Sorted array + binary search | $O(L \log N)$ | $O(L \log N)$ | ✓ | $O(N \cdot L)$ |
| Trie | $O(L)$ | $O(L)$ | ✓ (DFS) | $O(N \cdot L \cdot \Sigma)$ worst case |

Where $L$ is word length, $N$ is word count, and $\Sigma$ is alphabet size. The trie wins when prefix operations dominate. If you only need membership checks and don't care about prefixes, a hash set is simpler and faster in practice. The trie's memory overhead is the main downside — each node carries pointer overhead regardless of how many children it actually has.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Insert | $O(L)$ | $O(L)$ new nodes worst case |
| Search | $O(L)$ | $O(1)$ |
| StartsWith | $O(L)$ | $O(1)$ |
| Delete | $O(L)$ | $O(1)$ (freeing nodes) |
| Build from $N$ words | $O(N \cdot L)$ | $O(N \cdot L \cdot \Sigma)$ worst case |

$L$ is the length of the word. Space is bounded by the total number of unique prefixes across all inserted words times the children structure size.

## Key takeaways

- **Every path from root is a prefix** — the trie's structure inherently encodes all prefixes, making prefix queries $O(L)$ with zero extra work.
- **Shared prefixes share nodes** — words with common beginnings reuse the same path, which is the core reason tries beat hash sets for prefix-heavy workloads.
- **Use an array of size 26 for interviews** — when the alphabet is lowercase English, a fixed-size array gives constant-time child access and is simpler to code under pressure.
- **Tries enable early termination on grids** — in word search problems, walking the trie alongside the DFS lets you prune entire branches the moment no dictionary word matches the current path.
- **Space is the tradeoff** — tries can use significantly more memory than hash sets due to per-node pointer overhead; only reach for them when prefix operations are essential.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | 🟡 Medium | Build insert, search, and startsWith from scratch using a TrieNode with children array |
| [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | 🟡 Medium | Trie with DFS branching on wildcard `.` characters |
| [Word Search II](https://leetcode.com/problems/word-search-ii/) | 🔴 Hard | Build a trie from the dictionary and DFS on the board simultaneously for early pruning |
| [Replace Words](https://leetcode.com/problems/replace-words/) | 🟡 Medium | Insert roots into a trie, then find the shortest matching prefix for each word |
| [Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) | 🟡 Medium | Walk the trie character by character and DFS-collect up to 3 lexicographically smallest words |

## Relation to other topics

- **Suffix tree** is a compressed trie of all suffixes of a string. It enables $O(M)$ substring search where $M$ is the pattern length, but construction is complex (Ukkonen's algorithm).
- **Radix tree** (compressed trie / Patricia tree) merges single-child chains into one edge with a multi-character label. Same asymptotic complexity, but far less memory in practice. Used in Linux kernel routing tables and HTTP routers.
- **Aho-Corasick** builds a trie of patterns then adds failure links (like KMP) to enable multi-pattern matching in $O(N + M + Z)$ where $Z$ is the number of matches. It's what powers `grep -F` with multiple patterns.
- **DAWG** (Directed Acyclic Word Graph) shares both prefixes and suffixes, giving minimal space for a fixed dictionary.
