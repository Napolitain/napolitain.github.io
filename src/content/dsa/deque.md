---
title: "Deque (Double-Ended Queue)"
description: "Push and pop from both ends in O(1). A deque can behave like a queue, a stack, or a monotonic window depending on how you use it."
date: 2026-03-06
tags: ["deque", "queue", "stack", "linked-list", "sliding-window"]
draft: false
visualization: "DequeVisualization"
family: "linear"
kind: "data-structure"
difficulty: "intro"
prerequisites: ["queue"]
related: ["queue", "stack", "bfs-breadth-first-search", "two-pointers", "zero-one-bfs", "monotonic-queue"]
enables: ["bfs-breadth-first-search", "stack", "two-pointers", "zero-one-bfs", "monotonic-queue"]
---

## Problem

A queue gives you efficient work at one end. A stack gives you efficient work at one end too - but not the same end.

Sometimes you need **both**.

You want a structure that supports:

- push front
- push back
- pop front
- pop back

all in $O(1)$ time.

That structure is a deque.

## Intuition

**Deque** stands for **double-ended queue**.

Think of it as the general container, and then view other structures as restrictions:

- **Queue** = push back, pop front
- **Stack** = push and pop on the same end

This is why deques show up everywhere: they are flexible enough to model both FIFO and LIFO behavior, plus a few patterns that neither stacks nor queues can handle alone.

## Core operations

```
push_front(x)
push_back(x)
pop_front()
pop_back()
peek_front()
peek_back()
```

Every one of these should be $O(1)$.

## How to implement it

### Circular buffer

Use a fixed-size array (or dynamically resized array) and two indices:

- `front`
- `back`

Wrap them around with modulo arithmetic.

This is cache-friendly and often the fastest implementation in practice.

### Doubly linked list

Store pointers both ways:

```
Node {
    val
    prev
    next
}
```

Keep pointers to the head and tail. Then all four end operations are pointer rewrites.

This is conceptually simple, but has more pointer overhead than an array-backed deque.

## Why a deque matters

### 0-1 BFS

If every edge weight is 0 or 1, you can replace Dijkstra's priority queue with a deque:

- weight 0 -> push front
- weight 1 -> push back

That gives you linear time, $O(V + E)$.

### Monotonic queue

Sliding-window maximum/minimum problems use a deque whose values stay monotonic. The front is always the best candidate for the current window, while old indices fall off naturally as the window moves.

### Palindrome / two-ended processing

Any time input can be consumed from both sides, a deque is the natural fit.

### Undo/redo and task buffers

Systems code often needs to add urgent work to the front while leaving normal work at the back. A deque is the simplest structure for that.

## Queue vs stack vs deque

| Structure | Push | Pop | Typical use |
|---|---|---|---|
| Queue | Back | Front | BFS, scheduling |
| Stack | Same end | Same end | DFS, recursion simulation |
| Deque | Front or back | Front or back | 0-1 BFS, sliding windows, hybrid scheduling |

## Complexity

| Operation | Time |
|---|---|
| Push front/back | $O(1)$ |
| Pop front/back | $O(1)$ |
| Peek front/back | $O(1)$ |
| Space | $O(n)$ |

## Key takeaways

- A **deque** is the generalization of both queues and stacks
- If a problem needs efficient work at **both ends**, a deque should be one of your first guesses
- **0-1 BFS** is the signature deque algorithm: front for weight-0 edges, back for weight-1 edges
- The **monotonic queue** pattern is just a deque plus an ordering invariant, analogous to monotonic stacks
- Array-backed deques are usually the fastest practical implementation; linked lists buy flexibility at the cost of locality

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Design Circular Deque](https://leetcode.com/problems/design-circular-deque/) | 🟡 Medium | Implement both-end operations cleanly |
| [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | 🔴 Hard | Monotonic deque keeps the best candidate at the front |
| [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/) | 🟡 Medium | Standard queue-style BFS; good contrast with 0-1 BFS |
| [Jump Game VI](https://leetcode.com/problems/jump-game-vi/) | 🔴 Hard | Deque maintains the best DP candidate inside a window |
| [Open the Lock](https://leetcode.com/problems/open-the-lock/) | 🟡 Medium | Queue behavior as a restricted deque |

## Relation to other topics

- **Linked lists** provide one of the cleanest conceptual implementations of a deque
- **Stacks** and **queues** are both restricted views of the same structure
- **BFS** uses queue behavior; **0-1 BFS** upgrades that queue into a deque
- **Two pointers & sliding window** often turn into monotonic-deque problems when you also need max/min queries inside the window
