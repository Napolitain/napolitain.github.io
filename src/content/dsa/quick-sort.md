---
title: "Quick Sort"
description: "Pick a pivot, partition around it, recurse on both sides. Quick sort is the fastest general-purpose sort in practice despite O(n²) worst case."
date: 2026-03-05
tags: ["sorting", "divide-and-conquer", "array", "recursion"]
draft: false
visualization: "QuickSortVisualization"
family: "sorting"
kind: "algorithm"
difficulty: "intro"
prerequisites: []
related: ["merge-sort", "binary-search"]
enables: []
---

## Problem

Sort an array of $n$ elements in-place. Quick sort achieves $O(n \log n)$ on average with excellent cache performance and minimal overhead.

## Intuition

Choose a **pivot** element. Rearrange the array so everything less than the pivot is on the left, everything greater is on the right. The pivot is now in its final sorted position. Recurse on the left and right partitions.

Unlike merge sort where the work happens during merging, in quick sort the work happens during **partitioning**. After partitioning, no merge step is needed — the subarrays are simply concatenated.

## Algorithm (Lomuto partition)

```
quick_sort(arr, lo, hi):
    if lo >= hi:
        return

    pivot_index ← partition(arr, lo, hi)
    quick_sort(arr, lo, pivot_index - 1)
    quick_sort(arr, pivot_index + 1, hi)

partition(arr, lo, hi):
    pivot ← arr[hi]        // last element as pivot
    i ← lo - 1

    for j in lo..hi-1:
        if arr[j] <= pivot:
            i += 1
            swap(arr[i], arr[j])

    swap(arr[i + 1], arr[hi])
    return i + 1
```

### Lomuto vs Hoare partition

**Lomuto** (above): simpler, uses last element as pivot. One pointer `i` tracks the boundary of "elements ≤ pivot." Easy to understand and implement.

**Hoare**: two pointers start from opposite ends and walk toward each other, swapping elements that are on the wrong side. Does ~3x fewer swaps than Lomuto on average. The pivot doesn't end up at a known position — you get a partition point where everything left is ≤ pivot and everything right is ≥ pivot.

```
hoare_partition(arr, lo, hi):
    pivot ← arr[lo + (hi - lo) / 2]
    i ← lo - 1
    j ← hi + 1

    while true:
        do: i += 1 while arr[i] < pivot
        do: j -= 1 while arr[j] > pivot
        if i >= j: return j
        swap(arr[i], arr[j])
```

Hoare is faster in practice but trickier to implement correctly.

## Pivot selection matters

The pivot determines how balanced the partitions are:

| Pivot strategy | Worst case | Notes |
|---|---|---|
| First/last element | Already sorted input → $O(n^2)$ | Never use in production |
| Random element | $O(n^2)$ with astronomically low probability | Good practical choice |
| Median of three | Still $O(n^2)$ theoretically, much better in practice | Most implementations use this |
| Median of medians | Guaranteed $O(n \log n)$ | Theoretical interest only — too slow in practice |

**Median of three**: pick the median of `arr[lo]`, `arr[mid]`, `arr[hi]`. This avoids the worst case on sorted/reverse-sorted input and costs almost nothing.

## The worst case

Quick sort degrades to $O(n^2)$ when every partition produces one empty side and one side with $n-1$ elements. This happens with:
- First/last pivot on sorted input
- All equal elements (without three-way partition)

The call tree becomes a chain of $n$ levels, each doing $O(n)$ work. In practice, randomized pivot selection makes this vanishingly unlikely.

## Three-way partition (Dutch National Flag)

When the array contains many **duplicate** elements, standard quick sort wastes time re-partitioning equal elements. Three-way partition groups elements into `< pivot`, `== pivot`, `> pivot`:

```
three_way_partition(arr, lo, hi):
    pivot ← arr[lo]
    lt ← lo      // arr[lo..lt-1] < pivot
    i ← lo       // arr[lt..i-1] == pivot
    gt ← hi      // arr[gt+1..hi] > pivot

    while i <= gt:
        if arr[i] < pivot:
            swap(arr[i], arr[lt])
            lt += 1; i += 1
        else if arr[i] > pivot:
            swap(arr[i], arr[gt])
            gt -= 1
        else:
            i += 1

    // recurse only on < and > portions
    quick_sort(arr, lo, lt - 1)
    quick_sort(arr, gt + 1, hi)
```

This handles arrays with many duplicates in $O(n)$ instead of $O(n^2)$.

## Introsort: the production hybrid

Most standard library sort implementations (C++ `std::sort`, Rust's `sort_unstable`) use **introsort**: start with quick sort, but if the recursion depth exceeds $2 \log n$, switch to heap sort. This guarantees $O(n \log n)$ worst case while keeping quick sort's excellent average-case performance.

Some also switch to **insertion sort** for small subarrays ($n \leq 16$) because insertion sort has lower overhead on small inputs.

## Why quick sort beats merge sort in practice

Despite both being $O(n \log n)$ on average:

- **Cache locality**: quick sort partitions in-place, accessing contiguous memory. Merge sort bounces between the array and an auxiliary buffer.
- **No allocation**: quick sort uses $O(\log n)$ stack space. Merge sort needs $O(n)$ for the merge buffer.
- **Fewer writes**: on arrays, quick sort does fewer total writes than merge sort.

But merge sort wins on:
- **Stability**: quick sort is not stable
- **Guaranteed $O(n \log n)$**: merge sort has no bad inputs
- **Linked lists**: merge sort is far better for linked lists

## Complexity

| | Time (worst) | Time (best) | Time (avg) | Space | Stable |
|---|---|---|---|---|---|
| Quick sort | $O(n^2)$ | $O(n \log n)$ | $O(n \log n)$ | $O(\log n)$ | No |

The $O(\log n)$ space is for the recursion stack. With tail-call optimization on the larger partition, this is guaranteed.

## Key takeaways

- Work happens in the **partitioning phase** — after partitioning, the pivot is in its final sorted position with no merge needed
- **Pivot selection** is critical: median-of-three avoids worst case on sorted input at near-zero cost
- **Three-way partition** (Dutch National Flag) handles duplicate-heavy arrays in $O(n)$ instead of $O(n^2)$
- Quick sort beats merge sort in practice due to **cache locality** and no auxiliary memory allocation
- Production sorts use **introsort**: quick sort with heap sort fallback to guarantee $O(n \log n)$ worst case

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Sort an Array](https://leetcode.com/problems/sort-an-array/) | 🟡 Medium | Implement quick sort with randomized pivot to avoid worst case |
| [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) | 🟡 Medium | Quickselect — partition without fully sorting the array |
| [Sort Colors](https://leetcode.com/problems/sort-colors/) | 🟡 Medium | Dutch National Flag three-way partition in a single pass |
| [Wiggle Sort II](https://leetcode.com/problems/wiggle-sort-ii/) | 🟡 Medium | Partition around median then interleave elements |
| [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | 🟡 Medium | Quickselect on frequency counts to find top-k without full sort |

## Relation to other topics

- **Merge sort** — same divide-and-conquer structure, but work happens during merging; stable and guaranteed $O(n \log n)$ but needs $O(n)$ space
- **Quickselect** — uses the same partition step to find the k-th smallest element in $O(n)$ average time without fully sorting
- **Heap sort** — $O(n \log n)$ worst case and in-place, used as fallback in introsort when quick sort recurses too deep
