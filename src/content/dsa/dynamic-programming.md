---
title: "Dynamic Programming"
description: "Break a problem into overlapping subproblems, solve each once, reuse the results. DP turns exponential brute force into polynomial time."
date: 2026-03-05
tags: ["dynamic-programming", "recursion", "array"]
draft: false
visualization: "DpVisualization"
---

## Problem

Solve optimization or counting problems where the brute-force solution re-computes the same subproblems exponentially many times.

## Intuition

Dynamic programming is not a single algorithm — it's a **problem-solving technique**. It applies when a problem has two properties:

1. **Optimal substructure**: the optimal solution to the problem can be built from optimal solutions to its subproblems
2. **Overlapping subproblems**: the same subproblems appear multiple times in the recursion tree

If you have both, you can solve each subproblem once, store the result, and reuse it. This transforms exponential time into polynomial time.

## Fibonacci: the canonical example

Naive recursion:

```
fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```

This is $O(2^n)$ because `fib(n-1)` calls `fib(n-2)` and `fib(n-3)`, and `fib(n-2)` also calls `fib(n-3)` — massive duplication. `fib(5)` computes `fib(3)` twice, `fib(2)` three times, etc.

### Top-down (memoization)

Add a cache. Before computing, check if you already have the answer:

```
memo ← {}

fib(n):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] ← fib(n-1) + fib(n-2)
    return memo[n]
```

Same recursive structure, but each subproblem is solved exactly once. $O(n)$ time, $O(n)$ space.

### Bottom-up (tabulation)

Fill a table iteratively from the base cases upward:

```
fib(n):
    dp ← array of size n+1
    dp[0] ← 0, dp[1] ← 1

    for i in 2..n:
        dp[i] ← dp[i-1] + dp[i-2]

    return dp[n]
```

No recursion, no stack overhead. Same $O(n)$ time, $O(n)$ space. You can even reduce space to $O(1)$ since you only need the last two values:

```
fib(n):
    a ← 0, b ← 1
    for i in 2..n:
        a, b ← b, a + b
    return b
```

## Top-down vs bottom-up

| | Top-down (memoization) | Bottom-up (tabulation) |
|---|---|---|
| Style | Recursive + cache | Iterative + table |
| Computes | Only needed subproblems | All subproblems up to $n$ |
| Stack overflow risk | Yes (deep recursion) | No |
| Space optimization | Harder | Easier (can drop old rows) |
| Easier to write | Usually yes — natural recursion | Requires figuring out the order |

For most problems, either approach works. Bottom-up is generally preferred in production because it avoids stack overflow and is easier to optimize for space.

## The knapsack problem

You have $n$ items, each with weight $w_i$ and value $v_i$. You have a knapsack with capacity $W$. Maximize the total value without exceeding the capacity.

### 0/1 Knapsack (each item used at most once)

State: `dp[i][c]` = maximum value using items $1..i$ with capacity $c$.

Transition:
- **Don't take item $i$**: `dp[i][c] = dp[i-1][c]`
- **Take item $i$** (if $w_i \leq c$): `dp[i][c] = dp[i-1][c - w_i] + v_i`
- Take the max of both

```
knapsack(weights, values, W):
    n ← weights.length
    dp ← 2D array [n+1][W+1], filled with 0

    for i in 1..n:
        for c in 0..W:
            dp[i][c] ← dp[i-1][c]         // skip item
            if weights[i-1] <= c:
                dp[i][c] ← max(dp[i][c],
                    dp[i-1][c - weights[i-1]] + values[i-1])

    return dp[n][W]
```

Time: $O(nW)$. Space: $O(nW)$, reducible to $O(W)$ by only keeping the previous row.

Note: this is **pseudo-polynomial** — polynomial in $n$ and $W$, but $W$ could be exponentially large in the input size (number of bits). The knapsack problem is NP-complete.

## Common DP patterns

### 1D DP (linear sequence)
- **Climbing stairs**: `dp[i] = dp[i-1] + dp[i-2]`
- **House robber**: `dp[i] = max(dp[i-1], dp[i-2] + val[i])`
- **Longest increasing subsequence**: `dp[i] = max(dp[j] + 1)` for all $j < i$ where $a[j] < a[i]$

### 2D DP (grid/string)
- **Edit distance**: `dp[i][j]` = min edits to transform `s[0..i]` to `t[0..j]`
- **Longest common subsequence**: `dp[i][j]` = LCS of `s[0..i]` and `t[0..j]`
- **Matrix chain multiplication**: `dp[i][j]` = min multiplications for matrices $i..j$

### Interval DP
- **Burst balloons**: `dp[l][r]` = max coins from bursting balloons in range $[l, r]$
- **Palindrome partitioning**: `dp[l][r]` = min cuts for substring $[l, r]$

### DP on trees
- **Tree diameter, max path sum**: root the tree, compute bottom-up
- **Subtree problems**: `dp[node]` depends on `dp[child]` for all children

## Identifying DP problems

Ask yourself:
1. Can I define the answer in terms of answers to **smaller subproblems**?
2. Do the **same subproblems** appear repeatedly?
3. Is there a clear **base case**?

If yes to all three, it's likely DP. The hardest part is usually **defining the state** — what do `dp[i]`, `dp[i][j]`, etc. represent?

## Complexity

| Problem | Time | Space |
|---|---|---|
| Fibonacci | $O(n)$ | $O(1)$ optimized |
| 0/1 Knapsack | $O(nW)$ | $O(W)$ optimized |
| LCS | $O(nm)$ | $O(\min(n,m))$ optimized |
| Edit distance | $O(nm)$ | $O(\min(n,m))$ optimized |
| LIS | $O(n \log n)$ with binary search | $O(n)$ |
