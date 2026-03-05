---
title: "Merge Sort"
description: "Divide the array in half, sort each half, merge them back. Merge sort is the gold standard for stable, predictable O(n log n) sorting."
date: 2026-03-05
tags: ["sorting", "divide-and-conquer", "array", "recursion"]
draft: false
visualization: "MergeSortVisualization"
---

## Problem

Sort an array of $n$ elements in $O(n \log n)$ time, **stably** — preserving the relative order of equal elements.

## Intuition

Split the array in half. Sort each half recursively. Merge the two sorted halves into one sorted array. The merge step is the key: since both halves are already sorted, you just walk two pointers and pick the smaller element each time.

The recursion bottoms out at single-element arrays, which are trivially sorted. Everything useful happens during the **merge** phase, not the split phase. This is the opposite of quick sort, where the work happens during partitioning and the merge is trivial (concatenation).

## Algorithm

```
merge_sort(arr):
    if arr.length <= 1:
        return arr

    mid ← arr.length / 2
    left ← merge_sort(arr[0..mid])
    right ← merge_sort(arr[mid..end])

    return merge(left, right)

merge(left, right):
    result ← []
    i ← 0, j ← 0

    while i < left.length and j < right.length:
        if left[i] <= right[j]:    // <= for stability
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    append remaining elements from left or right
    return result
```

### Why `<=` and not `<` in the merge?

Using `<=` when comparing `left[i]` to `right[j]` ensures **stability**: if two elements are equal, the one from the left half (which appeared earlier in the original array) comes first in the output. Using `<` would still sort correctly but would break stability.

## Stability

Merge sort is **stable** — equal elements maintain their original relative order. This matters when:

- Sorting database records by one field while preserving a previous sort on another field
- Sorting objects where equality is defined on a subset of fields
- Chaining sorts (sort by last name, then stable sort by first name → sorted by first name, ties broken by last name)

Quick sort and heap sort are **not** stable. If you need a stable $O(n \log n)$ comparison sort, merge sort is your only choice among the classic algorithms.

## The merge step in detail

The merge of two sorted arrays of total size $n$ takes exactly $n$ comparisons and $n$ writes. Both pointers advance monotonically — no backtracking. This makes merge sort extremely **cache-friendly** during the merge phase, as you're reading sequentially from both halves.

However, merge sort requires $O(n)$ **auxiliary space** for the merge buffer. This is its main downside compared to quick sort (which sorts in-place with $O(\log n)$ stack space).

## Bottom-up merge sort

Instead of recursing top-down, you can merge iteratively bottom-up:

1. Treat each element as a sorted run of size 1
2. Merge adjacent pairs into sorted runs of size 2
3. Merge adjacent pairs into sorted runs of size 4
4. Continue doubling until one run covers the entire array

```
bottom_up_merge_sort(arr):
    width ← 1
    while width < arr.length:
        for i in range(0, arr.length, 2 * width):
            merge(arr, i, i + width, i + 2 * width)
        width *= 2
```

This avoids recursion overhead and is useful in environments where stack depth is limited.

## Merge sort on linked lists

Merge sort is the **best sorting algorithm for linked lists**. Why?

- **No random access needed.** Quick sort's partition step needs random access (or complex pointer manipulation). Merge sort only needs sequential traversal.
- **$O(1)$ extra space.** On arrays, merge needs an $O(n)$ buffer. On linked lists, the merge step just rewires pointers — no extra allocation.
- **Finding the midpoint.** Use the slow/fast pointer technique: slow advances by 1, fast by 2. When fast reaches the end, slow is at the middle.

This is why most standard library sort functions for linked lists use merge sort (e.g., Python's `list.sort()` uses Timsort which is merge-sort-based).

## External sorting

When data doesn't fit in memory, merge sort is the foundation of **external sorting**:

1. Read chunks that fit in RAM, sort each chunk in memory, write to disk
2. Merge sorted chunks using a $k$-way merge (with a min-heap of size $k$)

This is how databases and MapReduce sort terabytes of data. The sequential access pattern of merge sort is ideal for disk I/O, where random access is catastrophically slow.

## Inversions counting

A modified merge sort can count the number of **inversions** (pairs where $i < j$ but $a[i] > a[j]$) in $O(n \log n)$ time. During the merge step, whenever you pick an element from the right half, all remaining elements in the left half form inversions with it.

## Complexity

| | Time (worst) | Time (best) | Time (avg) | Space | Stable |
|---|---|---|---|---|---|
| Merge sort | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes |

The time complexity is always $O(n \log n)$ — there's no bad input that triggers worse behavior. The $\log n$ factor comes from the recursion depth (halving the array each time), and each level does $O(n)$ total merge work.
