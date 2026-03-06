---
title: "Two Pointers & Sliding Window"
description: "Shrink O(n²) brute force to O(n) by maintaining a window or two converging pointers. The go-to technique for subarray and subsequence problems."
date: 2026-03-05
tags: ["array", "two-pointers", "sliding-window"]
draft: false
visualization: "TwoPointersVisualization"
---

## Problem

Given an array or string, find a subarray/subsequence that satisfies some condition — often involving a sum, count, or character constraint — in $O(n)$ time.

## Intuition

Instead of checking all $O(n^2)$ pairs or subarrays, maintain two pointers (or a window boundary) that you advance based on the current state. The key insight: if advancing the right pointer makes the condition "too much," advance the left pointer to shrink the window. Each pointer moves at most $n$ times → $O(n)$ total.

## Two pointers (converging)

Two pointers start at opposite ends and walk toward each other. Used when the array is **sorted** and you're looking for a pair.

### Two Sum (sorted array)

```
two_sum(arr, target):
    left ← 0
    right ← arr.length - 1

    while left < right:
        sum ← arr[left] + arr[right]
        if sum == target:
            return (left, right)
        else if sum < target:
            left += 1      // need bigger sum
        else:
            right -= 1     // need smaller sum

    return not found
```

Why it works: if the sum is too small, the only way to increase it is to move `left` forward (to a larger value). If too big, move `right` backward. You never need to reconsider skipped positions because the array is sorted.

### Container with most water

Given heights $h[0..n-1]$, find the two lines that form a container holding the most water. Area = $\min(h[l], h[r]) \times (r - l)$.

```
max_area(heights):
    left ← 0, right ← heights.length - 1
    best ← 0

    while left < right:
        area ← min(heights[left], heights[right]) * (right - left)
        best ← max(best, area)

        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1

    return best
```

Why move the shorter side? The width decreases by 1 no matter which side you move. The only way to potentially increase the area is to find a taller line. Moving the taller side can't help — the area is bottlenecked by the shorter side.

## Sliding window (fixed size)

Maintain a window of exactly $k$ elements. Slide it across the array.

### Maximum sum subarray of size k

```
max_sum_k(arr, k):
    window_sum ← sum(arr[0..k-1])
    best ← window_sum

    for i in k..arr.length-1:
        window_sum += arr[i] - arr[i - k]  // slide: add right, remove left
        best ← max(best, window_sum)

    return best
```

Each step adds one element and removes one — $O(1)$ per step, $O(n)$ total. The brute force of recomputing the sum for each window would be $O(nk)$.

## Sliding window (variable size)

The window expands and contracts based on a condition. This is the most powerful pattern.

### Longest substring without repeating characters

```
longest_unique_substr(s):
    seen ← {}
    left ← 0
    best ← 0

    for right in 0..s.length-1:
        while s[right] in seen:
            seen.remove(s[left])
            left += 1

        seen.add(s[right])
        best ← max(best, right - left + 1)

    return best
```

`right` advances every iteration. `left` advances only when needed to restore the invariant (no duplicates). Both pointers only move forward → total work is $O(n)$.

### Minimum window substring

Find the smallest window in string $s$ that contains all characters of string $t$.

```
min_window(s, t):
    need ← character counts of t
    have ← 0, required ← len(need)
    left ← 0, best ← (∞, 0, 0)

    for right in 0..s.length-1:
        // Expand: add s[right]
        if s[right] in need:
            window_counts[s[right]] += 1
            if window_counts[s[right]] == need[s[right]]:
                have += 1

        // Contract: try to shrink from left
        while have == required:
            update best if current window is smaller
            if s[left] in need:
                window_counts[s[left]] -= 1
                if window_counts[s[left]] < need[s[left]]:
                    have -= 1
            left += 1

    return best
```

## When to use which pattern

| Pattern | When to use | Sorted needed? |
|---|---|---|
| Converging two pointers | Pair finding, triplet problems | Usually yes |
| Same-direction two pointers | Remove duplicates, partition | Sometimes |
| Fixed sliding window | Subarray of exact size $k$ | No |
| Variable sliding window | Shortest/longest subarray with constraint | No |
| Fast/slow pointers | Linked list cycle, middle finding | N/A |

## The monotonic invariant

The key to correctness in sliding window problems is maintaining an **invariant**: the window always represents a valid (or almost-valid) state. When expanding breaks the invariant, contract until it's restored. This ensures you don't miss any valid windows.

Think of it as: the left pointer is the **minimum** left boundary for the current right pointer. You never need to move left backward because doing so would only add more elements (potentially breaking the invariant more).

## Common mistakes

- **Forgetting that two pointers on unsorted arrays doesn't work** for pair-sum problems. Sort first, or use a hash map.
- **Off-by-one in window size**: `right - left + 1` is the window size, not `right - left`.
- **Not handling the contraction correctly**: when you shrink the window, make sure you undo whatever the removed element contributed (e.g., decrement a count).

## Complexity

| Pattern | Time | Space |
|---|---|---|
| Two pointers (converging) | $O(n)$ | $O(1)$ |
| Fixed sliding window | $O(n)$ | $O(1)$ or $O(k)$ |
| Variable sliding window | $O(n)$ | $O(k)$ where $k$ = alphabet/unique elements |

## Key takeaways

- **Each pointer moves at most n times** — this is what gives two-pointer techniques their $O(n)$ guarantee, even though it might look like nested loops.
- **Sorting is a prerequisite** for converging two pointers on pair-sum problems. Without sorted order, use a hash map instead.
- **Variable sliding window is the most versatile pattern** — it handles shortest/longest subarray problems with any monotonic constraint.
- **Maintain an invariant as you slide** — when expanding breaks it, contract from the left until it's restored. This guarantees you never miss a valid window.
- **Off-by-one errors are the #1 bug** — window size is `right - left + 1`, not `right - left`.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | 🟢 Easy | Converging pointers on a sorted array to find a target sum |
| [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | 🟡 Medium | Move the shorter side inward since width always decreases |
| [3Sum](https://leetcode.com/problems/3sum/) | 🟡 Medium | Sort + fix one element, then use two pointers for the remaining pair |
| [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | 🟡 Medium | Variable sliding window with a set to track duplicates |
| [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | 🔴 Hard | Expand to satisfy the constraint, then contract to minimize the window |

## Relation to other topics

- **Binary search**: converging two pointers on a sorted array is a generalization of binary search — both exploit sorted order to eliminate candidates.
- **Hash maps**: for unsorted arrays, hash maps solve pair-sum in $O(n)$ where two pointers can't. They're alternative approaches to the same class of problems.
- **Monotonic queues/deques**: sliding window max/min problems combine the sliding window framework with a monotonic deque for $O(n)$ solutions.
