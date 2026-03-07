---
title: "Binary Search"
description: "Halve the search space at every step. Binary search is not just for sorted arrays — it's a general technique for any monotonic predicate."
date: 2026-03-05
tags: ["binary-search", "divide-and-conquer", "array"]
draft: false
visualization: "BinarySearchVisualization"
family: "search"
kind: "technique"
difficulty: "intro"
prerequisites: []
related: ["binary-search-tree", "merge-sort", "quick-sort"]
enables: ["binary-search-tree", "segment-tree"]
---

## Problem

Given a **sorted** array and a target value, find the target's index (or determine it doesn't exist) in $O(\log n)$ time.

## Intuition

If the array is sorted, you can eliminate half the search space with each comparison. Compare the target to the middle element: if it's smaller, search the left half; if larger, search the right half. Repeat until found or the search space is empty.

This is the most fundamental divide-and-conquer algorithm. Every step cuts the problem in half, giving you $\log_2 n$ steps for $n$ elements. For a billion elements, that's only about 30 comparisons.

## Algorithm

```
binary_search(arr, target):
    lo ← 0
    hi ← arr.length - 1

    while lo <= hi:
        mid ← lo + (hi - lo) / 2  // avoid overflow
        if arr[mid] == target:
            return mid
        else if arr[mid] < target:
            lo ← mid + 1
        else:
            hi ← mid - 1

    return -1  // not found
```

### The overflow trap

`mid = (lo + hi) / 2` can overflow in languages with fixed-width integers when `lo + hi > INT_MAX`. The safe version is `mid = lo + (hi - lo) / 2`. This is identical mathematically but avoids the addition overflow. In Python this doesn't matter (arbitrary precision integers), but it matters in C, C++, Java, Go, Rust (in debug mode).

## Lower bound and upper bound

The basic binary search finds *any* occurrence. Often you need the **first** or **last** occurrence, or the insertion point.

### Lower bound (first element ≥ target)

```
lower_bound(arr, target):
    lo ← 0
    hi ← arr.length

    while lo < hi:
        mid ← lo + (hi - lo) / 2
        if arr[mid] < target:
            lo ← mid + 1
        else:
            hi ← mid

    return lo
```

This returns the **leftmost** position where `target` could be inserted to keep the array sorted. If `target` exists, it returns the index of the first occurrence.

### Upper bound (first element > target)

```
upper_bound(arr, target):
    lo ← 0
    hi ← arr.length

    while lo < hi:
        mid ← lo + (hi - lo) / 2
        if arr[mid] <= target:
            lo ← mid + 1
        else:
            hi ← mid

    return lo
```

The difference: `upper_bound - lower_bound` gives the **count** of elements equal to `target`.

## Binary search on a predicate

The real power of binary search isn't searching arrays — it's searching any **monotonic predicate**. If you have a function $f(x)$ that is `false` for all $x < k$ and `true` for all $x \geq k$, binary search finds $k$.

```
// Find smallest x in [lo, hi] where predicate(x) is true
binary_search_predicate(lo, hi, predicate):
    while lo < hi:
        mid ← lo + (hi - lo) / 2
        if predicate(mid):
            hi ← mid
        else:
            lo ← mid + 1
    return lo
```

### Examples of predicate binary search

**"Minimum speed to finish on time"**: Given tasks and a deadline, the predicate is "can I finish all tasks at speed $x$ within the deadline?" As speed increases, at some point the answer flips from false to true. Binary search on speed.

**"Minimum capacity to ship packages in D days"**: Predicate is "can I ship all packages with capacity $x$ in $\leq D$ days?" Binary search on capacity.

**"Koko eating bananas"**: Predicate is "can Koko eat all bananas at rate $k$ within $h$ hours?" Binary search on $k$.

The pattern is always: you have a search space of possible answers, and a way to check if a given answer is feasible. Binary search finds the boundary.

## Common mistakes

**Off-by-one errors.** The most common source of bugs. Pay attention to:
- `lo <= hi` vs `lo < hi` — the first includes the case where `lo == hi`, the second doesn't
- `hi = mid` vs `hi = mid - 1` — wrong choice causes infinite loops
- `lo = mid + 1` vs `lo = mid` — wrong choice causes infinite loops

**Tip**: when `lo < hi` with `lo = mid + 1` and `hi = mid`, the loop always terminates and `lo == hi` at the end. This is the safest template for lower/upper bound variants.

**Forgetting that the array must be sorted.** Binary search on an unsorted array gives garbage results.

**Using binary search when linear scan suffices.** For small arrays ($n < 50$), linear scan is often faster due to cache effects and branch prediction. Binary search's random access pattern is less cache-friendly.

## Binary search on answer

Many optimization problems can be converted to decision problems via binary search:

| Optimization problem | Decision problem (predicate) |
|---|---|
| Minimize maximum workload | "Can we distribute work so max workload ≤ $x$?" |
| Maximize minimum distance | "Can we place items so min distance ≥ $x$?" |
| Find exact threshold | "Does $f(x) \geq$ target?" |

If the decision problem is solvable in $O(g(n))$, then binary search on the answer gives $O(g(n) \log(\text{search space}))$.

## Complexity

| | Time | Space |
|---|---|---|
| Binary search | $O(\log n)$ | $O(1)$ |
| With predicate | $O(\log(\text{range}) \cdot \text{predicate cost})$ | depends on predicate |

The logarithmic factor is what makes it powerful. Doubling the input size adds just one more comparison.

## Key takeaways

- **Binary search applies to any monotonic predicate**, not just sorted arrays — if a property flips from false to true, you can binary-search the boundary.
- **Use `mid = lo + (hi - lo) / 2`** to avoid integer overflow in languages with fixed-width integers.
- **The `lo < hi` template with `lo = mid + 1` / `hi = mid` is the safest** — it always terminates with `lo == hi` pointing to the answer.
- **"Binary search on the answer"** converts optimization problems into decision problems — minimize/maximize by searching the answer space.
- **Off-by-one errors are the #1 bug source** — always be explicit about whether bounds are inclusive or exclusive and whether you want lower or upper bound.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Binary Search](https://leetcode.com/problems/binary-search/) | 🟢 Easy | Classic sorted-array search to nail the basic template |
| [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | 🟡 Medium | Determine which half is sorted, then decide which half to search |
| [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | 🟡 Medium | Binary search for the rotation pivot point |
| [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | 🟡 Medium | Binary search on the answer with a feasibility predicate |
| [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) | 🔴 Hard | Binary search on partition position to find the median in $O(\log n)$ |

## Relation to other topics

- **Two pointers** — both exploit sorted structure to skip unnecessary work; two pointers is linear while binary search is logarithmic.
- **Divide and conquer** — binary search is the simplest divide-and-conquer algorithm, halving the problem at each step.
- **Monotonic stack/queue** — like binary search, these techniques leverage monotonicity to efficiently find boundaries or extrema in sequences.
