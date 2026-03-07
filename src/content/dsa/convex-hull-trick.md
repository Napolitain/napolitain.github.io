---
title: "Convex Hull Trick"
description: "Maintain a set of lines so DP transitions of the form m*x + b can be optimized by querying only the best candidate line."
date: 2026-03-07
tags: ["dp", "optimization", "rare"]
draft: false
visualization: "ConvexHullTrickVisualization"
family: "strategy"
kind: "technique"
difficulty: "advanced"
prerequisites: ["dynamic-programming"]
related: ["li-chao-tree", "binary-search"]
enables: ["li-chao-tree"]
---

## Problem

Many DP recurrences look like:

$$
dp[i] = \min_j (m_j x_i + b_j)
$$

or the max version.

If you check every previous line candidate `j`, the transition becomes quadratic.

## Core idea

Interpret each candidate as a line. For a new query `x`, you only care about the line that gives the best value there.

The Convex Hull Trick maintains only the lines that are potentially optimal somewhere.

Depending on the constraints, you can support queries with:

- monotonic pointer walking
- binary search over intersection points
- more dynamic structures like Li Chao trees

## Why it matters

CHT is one of the most famous DP optimizations because it turns algebra into geometry.

It teaches a deep pattern:

> an optimization recurrence can sometimes be reframed as querying the lower or upper envelope of lines

## Complexity

The exact complexity depends on the variant, but monotonic or binary-search-based hulls often support near-linear or logarithmic transitions instead of quadratic ones.

## Key takeaways

- Convex Hull Trick is a DP optimization viewpoint, not one single implementation
- Every candidate transition becomes a line
- Queries ask which line is best at the current `x`
- This is rare advanced optimization material, but it is one of the most important specialized DP tools

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Line Add Get Min references](https://cp-algorithms.com/geometry/convex_hull_trick.html) | 🔴 Hard | Envelope of lines |
| [Acquire references](https://wcipeg.com/problem/ioi0221) | 🔴 Hard | Classic CHT DP optimization |
| [Covered Walkway references](https://usaco.guide/plat/convex-hull-trick) | 🔴 Hard | DP to line geometry |

## Relation to other topics

- **Dynamic Programming** is where CHT most often appears
- **Binary Search** shows up in static hull variants that search intersection order
- **Li Chao Tree** is the dynamic segment-tree flavored cousin of the same line-query idea
