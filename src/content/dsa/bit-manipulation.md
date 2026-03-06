---
title: "Bit Manipulation"
description: "Use bitwise operations for efficient computation. XOR tricks, counting bits, power-of-two checks, and bitmask patterns for subsets and flags."
date: 2026-03-06
tags: ["bit-manipulation", "math", "optimization"]
draft: false
visualization: "BitManipulationVisualization"
---

## Problem

Many problems reduce to operations on individual bits. Bitwise operations execute in $O(1)$ on fixed-width integers — a single CPU instruction. When you need to track boolean flags, enumerate subsets, or perform arithmetic tricks, bit manipulation replaces $O(n)$ loops with constant-time expressions and compresses $n$ booleans into a single integer.

## Core operations

Six operations form the basis. All operate independently on each bit position.

| Operation | Symbol | Rule |
|---|---|---|
| AND | `a & b` | 1 only if both bits are 1 |
| OR | `a \| b` | 1 if either bit is 1 |
| XOR | `a ^ b` | 1 if bits differ |
| NOT | `~a` | Flip every bit |
| Left shift | `a << k` | Shift bits left by $k$, fill with 0 |
| Right shift | `a >> k` | Shift bits right by $k$ |

**Truth table** (single-bit):

| a | b | AND | OR | XOR |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

Left shift by $k$ is equivalent to multiplication by $2^k$. Right shift by $k$ is integer division by $2^k$.

## Essential tricks

**Check if power of 2**: A power of 2 has exactly one set bit. `n & (n - 1)` clears the lowest set bit — if the result is 0, $n$ is a power of 2.

```
is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0
```

**Isolate lowest set bit**: `n & (-n)` extracts the lowest set bit. In two's complement, `-n = ~n + 1`, so the only surviving bit is the rightmost 1.

**Set bit $k$**: `n | (1 << k)`

**Clear bit $k$**: `n & ~(1 << k)`

**Toggle bit $k$**: `n ^ (1 << k)`

**Check bit $k$**: `(n >> k) & 1`

**Count set bits (Brian Kernighan)**: Each iteration of `n = n & (n - 1)` clears the lowest set bit. Count iterations until $n = 0$.

```
count_bits(n):
    count ← 0
    while n > 0:
        n ← n & (n - 1)
        count ← count + 1
    return count
```

This runs in $O(\text{number of set bits})$, not $O(\text{total bits})$.

## XOR patterns

XOR has three key properties: $a \oplus a = 0$, $a \oplus 0 = a$, and it is commutative + associative.

**Find single number**: Given an array where every element appears twice except one, XOR all elements. Duplicates cancel, leaving the unique value. $O(n)$ time, $O(1)$ space.

**Swap without temp variable**: `a ^= b; b ^= a; a ^= b;` — works because XOR is its own inverse.

**Find two unique numbers**: XOR all elements to get $x = a \oplus b$. Find any set bit in $x$ (use `x & -x`). Partition elements by that bit position and XOR each group separately to recover $a$ and $b$.

## Bitmask for subsets

An integer with $n$ bits represents a subset of $\{0, 1, \dots, n-1\}$. Bit $i$ is set if element $i$ is in the subset.

**Enumerate all $2^n$ subsets**:

```
for mask in 0 to (1 << n) - 1:
    for i in 0 to n - 1:
        if (mask >> i) & 1:
            // element i is in this subset
```

**Enumerate subsets of a given mask** (only subsets whose bits are a subset of `mask`):

```
sub ← mask
while sub > 0:
    // process sub
    sub ← (sub - 1) & mask
```

This visits every subset of `mask` exactly once in $O(2^{\text{popcount(mask)}})$.

## Common interview patterns

| Problem | Technique |
|---|---|
| Single Number | XOR all elements |
| Single Number II (appears 3 times) | Count bits mod 3 at each position |
| Hamming Distance | `popcount(a ^ b)` |
| Reverse Bits | Swap halves recursively or loop through positions |
| Missing Number (0 to $n$) | XOR indices with values |
| Power of Two | `n & (n - 1) == 0` |
| Subsets generation | Bitmask from $0$ to $2^n - 1$ |

## Complexity

All single-integer bitwise operations are $O(1)$. Brian Kernighan's bit count is $O(k)$ where $k$ is the number of set bits (at most $O(\log n)$ for value $n$). Subset enumeration with bitmask is $O(2^n)$.

## Relation to other topics

Bit manipulation appears inside many advanced techniques. **DP with bitmask** uses an integer to represent visited states — common in TSP and assignment problems where $dp[\text{mask}]$ tracks which elements have been used. **Hash functions** and **bloom filters** rely on bitwise mixing and bit-level addressing. XOR-based tricks show up in **randomized algorithms** and **error detection** (CRC, parity bits).
