---
title: "Stack & Monotonic Stack"
description: "LIFO data structure for expression evaluation, backtracking state, and the powerful monotonic stack pattern for next-greater-element problems."
date: 2026-03-06
tags: ["stack", "monotonic-stack", "array"]
draft: false
visualization: "MonotonicStackVisualization"
---

## Problem

Given an array, for each element find the **next greater element** — the first element to the right that is larger. Brute force is $O(n^2)$. A monotonic stack solves it in $O(n)$.

More broadly, stacks solve problems where **the most recent unresolved context matters**: matching brackets, evaluating expressions, undo history, DFS traversal, backtracking state.

## Intuition

A stack is **Last-In, First-Out**. Think of the function call stack: the most recently called function returns first. Every recursive algorithm implicitly uses a stack — converting recursion to iteration always involves an explicit one.

The monotonic stack extends this idea: maintain a stack whose elements are **always sorted** (increasing or decreasing). Every time you push, you pop elements that violate the invariant — and those pops answer the query for the popped elements.

## Basic operations

```
push(stack, val):    stack[++top] = val          O(1)
pop(stack):          return stack[top--]         O(1)
peek(stack):         return stack[top]           O(1)
isEmpty(stack):      return top == -1            O(1)
```

An array with a top pointer is all you need. No linked list, no overhead.

## Classic stack problems

**Valid parentheses** — push openers, pop on closers, check match. Stack empty at end → valid.

**Evaluate Reverse Polish Notation** — operands push, operators pop two operands and push result. The stack holds intermediate values.

**Min Stack** — maintain a second stack tracking the minimum at each depth. `getMin()` in $O(1)$.

**Decode String** — `3[a2[c]]` → stack stores the current string and repeat count before entering a bracket.

## Monotonic stack

The key insight: maintain a stack where elements are in **decreasing order** (for next-greater-element). When a new element is larger than the stack top, the top has found its answer.

```
next_greater_element(arr):
    n ← arr.length
    result ← [-1] * n
    stack ← []          // stores indices

    for i in 0..n-1:
        while stack is not empty AND arr[stack.top()] < arr[i]:
            idx ← stack.pop()
            result[idx] ← arr[i]
        stack.push(i)

    return result
```

Every element is pushed once and popped at most once → $O(n)$ total.

## Next greater element — walkthrough

Array: `[4, 2, 6, 1, 8, 3]`

| Step | Current | Stack (values) | Action | Result so far |
|------|---------|----------------|--------|---------------|
| 0 | 4 | `[4]` | Push | `[-1,-1,-1,-1,-1,-1]` |
| 1 | 2 | `[4,2]` | 2 < 4, push | — |
| 2 | 6 | `[6]` | Pop 2→6, pop 4→6, push 6 | `[6,-1,_,-1,-1,-1]` → result[0]=6, result[1]=6 |
| 3 | 1 | `[6,1]` | 1 < 6, push | — |
| 4 | 8 | `[8]` | Pop 1→8, pop 6→8, push 8 | result[2]=8, result[3]=8 |
| 5 | 3 | `[8,3]` | 3 < 8, push | — |

Final: `[6, 6, 8, 8, -1, -1]`. Elements left in the stack have no next greater element.

## Variations

**Next smaller element** — flip the comparison: maintain an *increasing* stack, pop when `arr[top] > arr[i]`.

**Previous greater element** — iterate left to right with a *decreasing* stack, but record the answer as `stack.top()` *before* pushing (rather than on pop).

**Stock span** — for each day, how many consecutive days before it had a smaller price? Previous greater element gives the boundary; span = current index − boundary index.

**Largest rectangle in histogram** — for each bar, find the nearest shorter bar on both sides (next smaller + previous smaller). Width × height gives candidate area. Classic $O(n)$ solution using one monotonic stack pass.

## When to use a monotonic stack

Any time you see: *"for each element, find the nearest element that is greater/smaller to the left/right."* That's $O(n^2)$ brute force reduced to $O(n)$ with a monotonic stack.

Pattern recognition: if the brute force is a nested loop where the inner loop scans left or right until it finds a threshold — a monotonic stack eliminates that inner loop.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Next greater element | $O(n)$ | $O(n)$ |
| Next smaller element | $O(n)$ | $O(n)$ |
| Largest rectangle in histogram | $O(n)$ | $O(n)$ |
| Valid parentheses | $O(n)$ | $O(n)$ |
| Evaluate RPN | $O(n)$ | $O(n)$ |
| Min stack (all ops) | $O(1)$ | $O(n)$ |

The $O(n)$ time for monotonic stack comes from amortized analysis: each element is pushed and popped at most once across the entire traversal.

## Key takeaways

- **Every element is pushed and popped at most once** in a monotonic stack — that's why the total work is $O(n)$ amortized, not $O(n^2)$.
- **Monotonic stacks eliminate inner loops**: any brute-force nested loop scanning left/right for a threshold can be replaced with a monotonic stack.
- **Maintain decreasing order for next-greater, increasing order for next-smaller** — flip the invariant to flip the query direction.
- **Stacks map directly to recursion**: any recursive solution can be converted to iterative with an explicit stack, and vice versa.
- **"Most recent unresolved context"** is the signal — if the problem involves matching, nesting, or backtracking to the latest open item, reach for a stack.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | 🟢 Easy | Push openers, pop and match on closers |
| [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | 🟡 Medium | Monotonic decreasing stack to find next warmer day |
| [Min Stack](https://leetcode.com/problems/min-stack/) | 🟡 Medium | Auxiliary stack tracking minimum at each depth |
| [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | 🔴 Hard | Monotonic stack to find bounding bars for each trapped section |
| [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | 🔴 Hard | Next-smaller on both sides to determine max width per bar |

## Relation to other topics

**Recursion** — every recursive call pushes a frame onto the call stack. Converting DFS from recursive to iterative means replacing the call stack with an explicit stack.

**DFS** — graph DFS uses a stack (implicit via recursion or explicit). BFS uses a queue. The only difference is LIFO vs FIFO.

**Monotonic queue (deque)** — the sliding window maximum problem. Same idea as monotonic stack but elements expire from the front when they leave the window. Implemented with a deque instead.
