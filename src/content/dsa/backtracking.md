---
title: "Backtracking"
description: "Systematically explore all possible solutions by building candidates incrementally and abandoning paths that cannot lead to valid solutions."
date: 2026-03-06
tags: ["backtracking", "recursion", "dfs", "tree"]
draft: false
visualization: "BacktrackingVisualization"
---

## Problem

Backtracking solves problems where you must find **all** (or one) valid configurations from a combinatorial search space: permutations, subsets, N-Queens, Sudoku, graph coloring, constraint satisfaction. The search space is typically exponential, and brute-forcing every possibility is infeasible without pruning.

## Intuition

Think of it as exploring a **decision tree**. At each node you make a choice (place a queen, pick a number, include an element). You go deeper until you either find a valid solution or hit a constraint violation. When a violation occurs, you **undo** the last choice and try the next option — this is the "backtrack" step.

The key insight: you don't need to explore the entire tree. As soon as a partial candidate violates a constraint, you **prune** the entire subtree rooted at that candidate. This turns an $O(n!)$ search into something far more manageable in practice.

## Algorithm

The general backtracking template:

```
backtrack(state, choices):
    if is_solution(state):
        record(state)
        return

    for choice in choices:
        if is_valid(state, choice):
            apply(state, choice)
            backtrack(state, remaining_choices)
            undo(state, choice)          ← backtrack
```

Three critical pieces: (1) a way to check if the current state is a complete solution, (2) a way to check if a partial choice is still valid, and (3) the undo step that restores state before trying the next branch.

## N-Queens

Place $n$ queens on an $n \times n$ board so that no two queens threaten each other — no shared row, column, or diagonal.

```
solve_queens(row, cols, diag1, diag2, board):
    if row == n:
        record(board)
        return

    for col in 0..n-1:
        if col not in cols
           and (row - col) not in diag1
           and (row + col) not in diag2:
            place queen at (row, col)
            solve_queens(row+1, cols ∪ {col},
                         diag1 ∪ {row-col}, diag2 ∪ {row+col}, board)
            remove queen from (row, col)   ← backtrack
```

We process one row at a time. The constraint sets `cols`, `diag1` ($row - col$ is constant on each `\` diagonal), and `diag2` ($row + col$ is constant on each `/` diagonal) give $O(1)$ conflict checking. For $n = 8$, there are 92 solutions; the algorithm explores far fewer than $8^8$ states thanks to pruning.

## Permutations and subsets

**Permutations** of $[1..n]$: at each depth, choose an unused element. The decision tree has $n!$ leaves.

```
permute(path, used):
    if len(path) == n:
        record(path)
        return
    for i in 0..n-1:
        if i not in used:
            permute(path + [nums[i]], used ∪ {i})
```

**Subsets** of $[1..n]$: at each depth, decide include or exclude. The decision tree has $2^n$ leaves.

```
subsets(index, current):
    if index == n:
        record(current)
        return
    subsets(index + 1, current)              ← exclude
    subsets(index + 1, current + [nums[index]])  ← include
```

Both are canonical backtracking patterns. The structure is identical — only the branching logic changes.

## Pruning strategies

- **Constraint propagation**: after placing a queen, immediately mark all threatened positions. Fail early if any future row has zero valid columns.
- **Symmetry breaking**: for N-Queens, fix the first queen to the left half of row 0 and double the count. Avoids exploring mirror solutions.
- **Ordering heuristics**: try the most constrained variable first (MRV). In Sudoku, pick the cell with fewest legal values — this maximizes pruning.
- **Bound checking**: if a partial solution already exceeds a known bound (knapsack, TSP), prune. This is the bridge to branch-and-bound.

## When to use backtracking

| Situation | Use |
|---|---|
| Find **all** valid configurations | Backtracking |
| Optimal value over overlapping subproblems | Dynamic programming |
| Enumerate without constraints | Brute force / iterative |
| Optimal solution with bounds | Branch and bound |

Backtracking is the right tool when you need **exhaustive search with pruning**. If subproblems overlap and you only need an optimal value (not all solutions), DP is better. If no pruning is possible, you're just doing brute force with extra steps.

## Complexity

| Problem | Time | Space |
|---|---|---|
| N-Queens | $O(n!)$ worst case | $O(n)$ |
| Permutations | $O(n \cdot n!)$ | $O(n)$ |
| Subsets | $O(n \cdot 2^n)$ | $O(n)$ |
| Sudoku ($9 \times 9$) | $O(9^{81})$ worst, much less with pruning | $O(81)$ |
| Graph coloring ($k$ colors) | $O(k^n)$ | $O(n)$ |

Space is always proportional to the depth of the decision tree — the recursion stack holds one path from root to the current node.

## Key takeaways

- **Backtracking = DFS + undo** — the core loop is always: choose, recurse, unchoose. Master this template and every backtracking problem is a variation of it.
- **Pruning is everything** — without constraint checks, backtracking is just brute force. The earlier you detect an invalid partial candidate, the more subtrees you skip.
- **Permutations branch on unused elements, subsets branch on include/exclude** — recognizing which pattern a problem follows immediately tells you the branching factor and tree shape.
- **State restoration must be exact** — if `apply` modifies a set, array, or board, `undo` must reverse it perfectly. Bugs here are the #1 source of wrong answers in interviews.
- **Complexity is exponential by nature** — backtracking problems are inherently $O(n!)$ or $O(2^n)$; the goal is pruning, not polynomial time.

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [N-Queens](https://leetcode.com/problems/n-queens/) | 🔴 Hard | Place queens row by row, tracking columns and both diagonals in sets for $O(1)$ conflict checks |
| [Permutations](https://leetcode.com/problems/permutations/) | 🟡 Medium | Classic backtracking — branch on unused elements, build the path incrementally |
| [Subsets](https://leetcode.com/problems/subsets/) | 🟡 Medium | Include/exclude decision at each index; every node in the tree is a valid subset |
| [Combination Sum](https://leetcode.com/problems/combination-sum/) | 🟡 Medium | Allow reusing the same element by not advancing the index after choosing it |
| [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/) | 🔴 Hard | Fill cells one at a time, pruning with row/column/box constraints; MRV heuristic helps |

## Relation to other topics

- **DFS on an implicit graph**: backtracking is DFS where the graph is the decision tree of all partial candidates. You never build the full graph — nodes are generated on the fly.
- **Branch and bound**: backtracking + a cost bound. If the partial solution's lower bound exceeds the best known, prune. Used in optimization problems (TSP, integer programming).
- **Constraint satisfaction (CSP)**: backtracking is the standard algorithm for CSPs. Arc consistency, forward checking, and MAC are pruning enhancements layered on top of the same core loop.
