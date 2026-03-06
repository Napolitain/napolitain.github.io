---
title: "Greedy Algorithms"
description: "Make the locally optimal choice at each step to find a global optimum. Greedy works when the problem has optimal substructure and the greedy choice property."
date: 2026-03-06
tags: ["greedy", "sorting", "optimization"]
draft: false
visualization: "GreedyVisualization"
---

## Problem

Find an optimal solution (maximize or minimize some objective) where making a sequence of locally best choices leads to a globally best result — without backtracking or reconsidering.

## Intuition

A greedy algorithm works when the problem has two properties:

1. **Greedy choice property**: a locally optimal choice at each step is part of some globally optimal solution. You never need to undo a decision.
2. **Optimal substructure**: after making a greedy choice, the remaining problem is a smaller instance of the same problem.

If both hold, greedily choosing the best option at each step and solving the residual subproblem gives an optimal answer. If either fails, greedy may produce a wrong answer — and you likely need DP or exhaustive search.

## Interval scheduling — the classic greedy

Given $n$ intervals $[s_i, e_i)$, select the **maximum** number of non-overlapping intervals.

**Key insight**: always pick the interval that **ends earliest**. This leaves the most room for future intervals.

```
interval_scheduling(intervals):
    sort intervals by end time
    selected ← []
    last_end ← -∞

    for each interval [s, e] in sorted order:
        if s >= last_end:
            selected.append([s, e])
            last_end ← e

    return selected
```

Sorting is $O(n \log n)$, the scan is $O(n)$. Total: $O(n \log n)$.

## Activity selection — weighted vs unweighted

The unweighted case above is pure greedy. When each interval has a **weight** (profit), the greedy choice property breaks: picking the earliest-ending interval might skip a high-value one. Weighted interval scheduling requires DP:

$$\text{dp}[i] = \max(\text{dp}[i-1],\; w_i + \text{dp}[p(i)])$$

where $p(i)$ is the latest interval that doesn't overlap interval $i$. The unweighted version is the special case where all weights equal 1.

## Other greedy patterns

**Fractional knapsack**: sort items by value-to-weight ratio $v_i / w_i$. Take as much as possible of the best ratio first. Unlike 0/1 knapsack, fractions are allowed, so greedy is optimal. $O(n \log n)$.

**Huffman coding**: repeatedly merge the two lowest-frequency symbols into one node. Builds an optimal prefix-free code. $O(n \log n)$ with a min-heap.

**Jump game**: at each position, jump as far as you can reach. Track the farthest reachable index — if it reaches the end, the answer is yes. $O(n)$.

**Minimum spanning tree**: both Kruskal's (sort edges, union-find) and Prim's (min-heap of crossing edges) are greedy on edge weights.

## When greedy fails

**0/1 knapsack**: you can't take fractions, so the ratio-based greedy picks wrong items. Need DP.

**Coin change** (arbitrary denominations): greedy picks the largest coin first, but for denominations like $\{1, 3, 4\}$ with target $6$, greedy gives $4+1+1$ (3 coins) instead of optimal $3+3$ (2 coins). With standard denominations $\{1, 5, 10, 25\}$, greedy happens to work.

**Graph coloring**: greedily assigning the smallest available color doesn't guarantee the chromatic number.

## Proving greedy correctness

Two standard techniques:

**Exchange argument**: assume an optimal solution $O$ differs from greedy solution $G$. Show you can swap a choice in $O$ for the greedy choice without worsening the objective. Repeat until $O = G$.

**Greedy stays ahead**: after each step $k$, show the greedy solution is at least as good as any other solution's first $k$ choices. By induction, greedy is optimal at the end.

Both boil down to: "we never regret the greedy choice."

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| Interval scheduling | $O(n \log n)$ | $O(n)$ |
| Fractional knapsack | $O(n \log n)$ | $O(1)$ extra |
| Huffman coding | $O(n \log n)$ | $O(n)$ |
| Jump game | $O(n)$ | $O(1)$ |
| Kruskal's MST | $O(E \log E)$ | $O(V)$ |

## Key takeaways

- **Greedy choice property + optimal substructure** are the two conditions that must hold; if either fails, greedy produces wrong answers and you need DP or exhaustive search.
- **Sort first** — most greedy problems start by sorting on the right criterion (earliest end time, best ratio, farthest reach). Choosing the wrong sort key is the most common mistake.
- **Exchange argument** is the go-to proof technique: show you can swap any non-greedy choice in an optimal solution without worsening the result.
- **Greedy is a special case of DP** where only one subproblem matters at each step — always try greedy first, then fall back to DP if the greedy choice property doesn't hold.
- **Interval scheduling** (sort by end time) is the canonical example; master it and the pattern transfers to task scheduling, meeting rooms, and merge intervals.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Jump Game](https://leetcode.com/problems/jump-game/) | 🟡 Medium | Track the farthest reachable index greedily from left to right |
| [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | 🟡 Medium | BFS-like greedy using current and next reachable boundary to minimize jumps |
| [Gas Station](https://leetcode.com/problems/gas-station/) | 🟡 Medium | Track running fuel surplus to identify the unique valid starting index |
| [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | 🟡 Medium | Greedily schedule the most frequent task first and calculate idle slots |
| [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | 🟡 Medium | Sort by end time and count overlapping intervals to remove (interval scheduling) |

## Relation to other topics

| | Greedy | DP | Brute force |
|---|---|---|---|
| Explores | 1 choice per step | All subproblems | All combinations |
| Backtracks | Never | Implicitly (via table) | Explicitly |
| Time | Usually $O(n \log n)$ | Polynomial (often $O(n^2)$ or $O(nW)$) | Exponential |
| Correct when | Greedy choice property holds | Optimal substructure + overlapping subproblems | Always |

Greedy is a special case of DP where only one subproblem needs to be solved at each step. When it works, it's the simplest and fastest approach.
