---
title: "Heap & Priority Queue"
description: "A complete binary tree where every parent is smaller (or larger) than its children. The backbone of Dijkstra, event scheduling, and top-k problems."
date: 2026-03-05
tags: ["heap", "priority-queue", "tree", "sorting", "array"]
draft: false
visualization: "HeapVisualization"
family: "tree"
kind: "data-structure"
difficulty: "intermediate"
prerequisites: ["tree-fundamentals"]
related: ["binary-search-tree", "dijkstra", "minimum-spanning-tree", "greedy", "treap", "external-merge-sort"]
enables: ["dijkstra", "minimum-spanning-tree", "external-merge-sort", "treap"]
---

## Problem

Maintain a collection that supports **insert** and **extract-min** (or max) in $O(\log n)$ time. This is a priority queue — elements come out in priority order, not insertion order.

## Intuition

A binary heap is a **complete binary tree** stored in an array. The heap property says: every parent is smaller than both children (min-heap) or larger (max-heap).

Since the tree is complete, it maps perfectly to an array:
- Node at index $i$
- Left child: $2i + 1$
- Right child: $2i + 2$
- Parent: $\lfloor(i - 1) / 2\rfloor$

No pointers needed. The array IS the tree.

## Operations

### Insert (bubble up)

Add the new element at the end of the array (next available leaf position). Then **bubble up**: compare with parent, swap if smaller, repeat until the heap property is restored.

```
insert(heap, val):
    heap.append(val)
    i ← heap.length - 1

    while i > 0:
        parent ← (i - 1) / 2
        if heap[i] < heap[parent]:
            swap(heap[i], heap[parent])
            i ← parent
        else:
            break
```

Worst case: the new element is the smallest and bubbles all the way to the root → $O(\log n)$.

### Extract-min (bubble down)

Remove the root (minimum element). Replace it with the last element in the array. Then **bubble down**: compare with both children, swap with the smaller child, repeat.

```
extract_min(heap):
    min_val ← heap[0]
    heap[0] ← heap.pop()  // move last to root

    i ← 0
    while true:
        left ← 2 * i + 1
        right ← 2 * i + 2
        smallest ← i

        if left < heap.length and heap[left] < heap[smallest]:
            smallest ← left
        if right < heap.length and heap[right] < heap[smallest]:
            smallest ← right

        if smallest == i:
            break
        swap(heap[i], heap[smallest])
        i ← smallest

    return min_val
```

### Peek

Just return `heap[0]`. The minimum is always at the root. $O(1)$.

## Heapify: building a heap in $O(n)$

You might think building a heap from $n$ elements takes $O(n \log n)$ — insert each element one by one. But there's a faster way: **bottom-up heapify**.

Start from the last non-leaf node and bubble down each node:

```
heapify(arr):
    for i in (arr.length / 2 - 1) down to 0:
        bubble_down(arr, i)
```

Why is this $O(n)$ and not $O(n \log n)$? Most nodes are near the bottom of the tree and bubble down only a few levels. Formally: the sum $\sum_{h=0}^{\log n} \frac{n}{2^{h+1}} \cdot h = O(n)$.

This is important because it means heap sort's initial heap construction is $O(n)$, not $O(n \log n)$.

## Heap sort

Build a max-heap, then repeatedly extract the maximum and place it at the end:

```
heap_sort(arr):
    heapify(arr)  // build max-heap: O(n)

    for i in (arr.length - 1) down to 1:
        swap(arr[0], arr[i])        // move max to sorted portion
        bubble_down(arr, 0, size=i)  // restore heap on reduced array
```

Heap sort is $O(n \log n)$ always (no bad inputs), in-place ($O(1)$ extra space), but **not stable** and has poor cache locality (the bubble-down step jumps around the array).

## Where heaps shine

**Dijkstra's algorithm**: the priority queue is a min-heap of `(distance, node)` pairs. Extract-min gives you the nearest unvisited node.

**Top-k elements**: maintain a min-heap of size $k$. For each element, if it's larger than the heap's minimum, replace the minimum. At the end, the heap contains the $k$ largest elements. $O(n \log k)$.

**Merge k sorted lists**: maintain a min-heap of size $k$ containing the current head of each list. Extract-min, advance that list, insert the next element. $O(n \log k)$ where $n$ is total elements.

**Event-driven simulation**: events are processed in chronological order. New events are inserted as they're generated. A min-heap on timestamp gives you the next event in $O(\log n)$.

**Median maintenance**: use two heaps — a max-heap for the lower half and a min-heap for the upper half. The median is at one of the roots. Insert and rebalance in $O(\log n)$.

## Min-heap vs max-heap

Most languages provide a min-heap by default. To get a max-heap, negate the values on insert and negate again on extract. Or use a comparator.

| Language | Default | Max-heap trick |
|---|---|---|
| Python `heapq` | Min-heap | Insert `-val` |
| Java `PriorityQueue` | Min-heap | `Collections.reverseOrder()` |
| C++ `priority_queue` | **Max-heap** | `greater<>` for min-heap |
| Go `container/heap` | Interface-based | Implement `Less` accordingly |

## Complexity

| Operation | Time |
|---|---|
| Insert | $O(\log n)$ |
| Extract-min/max | $O(\log n)$ |
| Peek | $O(1)$ |
| Heapify (build) | $O(n)$ |
| Heap sort | $O(n \log n)$ |

Space is $O(n)$ for the array. No auxiliary space needed beyond the array itself.

## Key takeaways

- **A heap is a complete binary tree stored in an array** — parent at index $i$, children at $2i+1$ and $2i+2$, no pointers needed.
- **Bottom-up heapify is $O(n)$, not $O(n \log n)$** — most nodes are near the bottom and bubble down only a few levels.
- **Use a min-heap of size $k$ for top-k problems** — this gives $O(n \log k)$ time, much better than sorting when $k \ll n$.
- **Two heaps solve the running median** — a max-heap for the lower half and a min-heap for the upper half, with the median at one of the roots.
- **Most languages default to min-heap** — negate values for a max-heap, except C++ which defaults to max-heap.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | 🟢 Easy | Maintain a min-heap of size $k$; the root is always the answer |
| [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | 🟡 Medium | Count frequencies, then use a heap to extract the top $k$ |
| [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | 🔴 Hard | Two-heap approach: max-heap for lower half, min-heap for upper half |
| [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | 🔴 Hard | Min-heap of size $k$ holding the current head of each list |
| [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | 🟡 Medium | Max-heap to always schedule the most frequent remaining task |

## Relation to other topics

- **Graphs**: heaps are the backbone of Dijkstra's shortest path and Prim's MST algorithms, providing efficient extract-min for greedy vertex selection.
- **Sorting**: heap sort uses the heap structure for $O(n \log n)$ in-place sorting, though it has worse cache locality than quicksort.
- **Binary search trees**: BSTs support the same operations plus ordered traversal and predecessor/successor queries, but with higher constant factors and pointer overhead.
