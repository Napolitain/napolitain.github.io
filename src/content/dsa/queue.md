---
title: "Queue"
description: "Process work in first-in, first-out order. Queues are the missing linear-structure foundation behind BFS, buffering, and fair scheduling."
date: 2026-03-07
tags: ["queue", "fifo", "bfs", "linear"]
draft: false
visualization: "QueueVisualization"
family: "linear"
kind: "data-structure"
difficulty: "intro"
prerequisites: []
related: ["deque", "stack", "linked-list", "bfs-breadth-first-search"]
enables: ["deque", "bfs-breadth-first-search", "monotonic-queue"]
---

## Problem

You need to process items in the same order they arrive.

Examples:

- users waiting in line
- tasks waiting for a worker
- nodes waiting for breadth-first exploration
- packets waiting inside a buffer

A stack is wrong because it reverses the order. A queue keeps the oldest item at the front.

## Core idea

A queue supports two main operations:

- `enqueue(x)` inserts at the **back**
- `dequeue()` removes from the **front**

That makes it a **FIFO** structure: first in, first out.

## Why it matters

Queues are simple, but they unlock a surprising amount of the atlas:

- **BFS** depends on a queue to expand the graph one layer at a time
- **Deque** generalizes a queue by allowing work at both ends
- **Monotonic queue** builds on queue order plus a dominance rule

Without a queue, breadth-first processing has no clean data structure behind it.

## Implementations

### Array with head pointer
Fast and compact if you avoid shifting all elements on every pop.

### Circular buffer
The classic fixed-capacity queue. Head and tail wrap around.

### Linked list
Useful when dynamic growth matters and you want $O(1)$ insertion/removal at both logical ends.

## Complexity

| Operation | Time |
|---|---|
| Enqueue | $O(1)$ |
| Dequeue | $O(1)$ |
| Front | $O(1)$ |

## Common mistakes

- Using an array and calling a full left-shift on every dequeue
- Reaching for a deque when a plain queue would be clearer
- Forgetting that FIFO order is the reason BFS gives shortest paths in unweighted graphs

## Key takeaways

- A queue is the canonical FIFO structure
- It is the missing conceptual step between linked lists and graph traversal
- BFS is not just “a graph algorithm”; it is graph traversal powered by queue discipline
- Deque and monotonic queue both make more sense once the plain queue comes first

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Number of Recent Calls](https://leetcode.com/problems/number-of-recent-calls/) | 🟢 Easy | Keep only active items in FIFO order |
| [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/) | 🟡 Medium | Understand exactly what FIFO gives you |
| [Open the Lock](https://leetcode.com/problems/open-the-lock/) | 🟡 Medium | BFS frontier is literally a queue |

## Relation to other topics

- **Deque** extends a queue to both ends
- **BFS** uses a queue to visit nodes by distance layer
- **Monotonic queue** preserves FIFO order while deleting dominated candidates
