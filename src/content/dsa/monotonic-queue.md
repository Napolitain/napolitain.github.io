---
title: "Monotonic Queue"
description: "Maintain sliding-window candidates in sorted order inside a deque so each window maximum or minimum is available in O(1)."
date: 2026-03-07
tags: ["monotonic-queue", "deque", "sliding-window", "array"]
draft: false
visualization: "MonotonicQueueVisualization"
family: "linear"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["queue", "deque", "two-pointers"]
related: ["stack", "dynamic-programming", "prefix-sum"]
enables: ["dynamic-programming"]
---

## Problem

You need an answer for every fixed-size sliding window, such as:

- maximum in every window of size `k`
- minimum in every window of size `k`

A naive solution rescans each window, costing $O(nk)$. That is far too slow when the array is long.

## Core idea

Keep a deque of **candidate indices**.

For a maximum queue:

- remove indices that fell out of the window from the front
- remove indices from the back while their values are smaller than the new value
- append the new index
- the front now holds the maximum for the current window

The deque stays in decreasing value order.

## Why it works

If a new value is greater than an older value still sitting at the back, that older value can never become the answer for any future window that also contains the new value.

So you delete it permanently.

That one dominance rule is what makes the whole technique linear.

## Algorithm sketch

```
for right in 0..n-1:
    remove expired indices from front
    while deque not empty and a[deque.back] <= a[right]:
        pop_back()
    push_back(right)

    if right >= k - 1:
        answer.push(a[deque.front])
```

## Complexity

| Operation | Time |
|---|---|
| Whole pass | $O(n)$ |

Each index enters the deque once and leaves once.

## Why it matters

Monotonic queues are one of the best examples of a technique that looks niche but appears everywhere once you know to see it:

- sliding-window maximum/minimum
- DP transitions with bounded ranges
- online candidate maintenance where older dominated states can be discarded

It is the queue-side sibling of a monotonic stack.

## Key takeaways

- A monotonic queue is not just a queue; it is a queue plus a dominance invariant
- The deque stores candidates, not every value blindly
- Front gives the current answer, back is where dominated candidates get removed
- This is an important non-rare technique because sliding windows are everywhere

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | 🔴 Hard | Canonical monotonic-queue problem |
| [Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/) | 🔴 Hard | Prefix sums plus monotonic deque |
| [Jump Game VI](https://leetcode.com/problems/jump-game-vi/) | 🟡 Medium | DP optimization with a deque |

## Relation to other topics

- **Queue** gives the FIFO processing model
- **Deque** provides the two-ended operations monotonic queues rely on
- **Monotonic stack** uses the same dominance idea in a one-directional setting
