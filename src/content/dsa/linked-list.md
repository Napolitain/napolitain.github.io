---
title: "Linked List Operations"
description: "Reverse, detect cycles, merge sorted lists. Linked lists test your pointer manipulation skills — every operation is about rewiring next pointers."
date: 2026-03-05
tags: ["linked-list", "two-pointers", "recursion"]
draft: false
visualization: "LinkedListVisualization"
family: "linear"
kind: "data-structure"
difficulty: "intro"
prerequisites: []
related: ["queue", "deque", "stack", "two-pointers", "hash-map", "skip-list", "cache-eviction-strategies"]
enables: ["queue", "deque", "stack", "two-pointers", "skip-list", "cache-eviction-strategies"]
---

## What is a linked list?

A sequence of nodes where each node holds a value and a pointer to the next node. The last node points to `null`.

```
Node {
    val: T
    next: Node | null
}
```

Unlike arrays, linked lists don't have random access. You can't jump to index $i$ — you must walk from the head. But insertion and deletion at a known position are $O(1)$ (just rewire pointers), compared to $O(n)$ for arrays (shifting elements).

## Reversal

The most fundamental linked list operation. Reverse the direction of all `next` pointers.

### Iterative (3-pointer technique)

```
reverse(head):
    prev ← null
    curr ← head

    while curr is not null:
        next ← curr.next    // save next
        curr.next ← prev    // reverse pointer
        prev ← curr         // advance prev
        curr ← next         // advance curr

    return prev              // new head
```

Three pointers walk through the list in lockstep: `prev`, `curr`, `next`. At each step, you point `curr.next` backward to `prev`, then advance all three. When `curr` reaches `null`, `prev` is the new head.

### Recursive

```
reverse(head):
    if head is null or head.next is null:
        return head

    new_head ← reverse(head.next)
    head.next.next ← head   // point successor back to us
    head.next ← null         // break forward link

    return new_head
```

The recursive version works from the tail backward. Each frame says: "reverse everything after me, then make my successor point back to me." Elegant, but uses $O(n)$ stack space.

## Cycle detection (Floyd's algorithm)

Also called the **tortoise and hare** algorithm. Use two pointers: slow advances by 1, fast advances by 2.

```
has_cycle(head):
    slow ← head
    fast ← head

    while fast is not null and fast.next is not null:
        slow ← slow.next
        fast ← fast.next.next

        if slow == fast:
            return true      // cycle detected

    return false             // no cycle
```

**Why it works**: if there's a cycle, fast enters the cycle first. Slow enters later. Once both are in the cycle, fast approaches slow at a rate of 1 node per step (their distance decreases by 1 each iteration). They must eventually meet.

**Why not just use a hash set?** You could — store every visited node and check for duplicates. That's $O(n)$ space. Floyd's uses $O(1)$ space. In an interview, the follow-up is always "can you do it in constant space?"

### Finding the cycle start

After slow and fast meet, reset one pointer to the head. Advance both by 1. Where they meet again is the **start of the cycle**.

```
find_cycle_start(head):
    slow ← head
    fast ← head

    // Phase 1: detect cycle
    while fast and fast.next:
        slow ← slow.next
        fast ← fast.next.next
        if slow == fast: break

    if fast is null or fast.next is null:
        return null  // no cycle

    // Phase 2: find start
    slow ← head
    while slow != fast:
        slow ← slow.next
        fast ← fast.next

    return slow
```

The math: if the cycle starts at distance $d$ from the head, and the meeting point is $k$ steps into the cycle, then $d = \text{cycle\_length} - k$. Resetting one pointer to the head and advancing both by 1 makes them meet at the cycle start.

## Merge two sorted linked lists

Given two sorted linked lists, merge them into one sorted list. This is the merge step of merge sort on linked lists.

```
merge(l1, l2):
    dummy ← Node(0)
    tail ← dummy

    while l1 and l2:
        if l1.val <= l2.val:
            tail.next ← l1
            l1 ← l1.next
        else:
            tail.next ← l2
            l2 ← l2.next
        tail ← tail.next

    tail.next ← l1 or l2    // append remaining
    return dummy.next
```

**Dummy node trick**: using a dummy head node avoids special-casing the first insertion. The merged list starts at `dummy.next`.

## Fast/slow pointer pattern

The tortoise-and-hare pattern extends beyond cycle detection:

| Problem | Slow speed | Fast speed | What it finds |
|---|---|---|---|
| Find middle | 1 | 2 | Middle node (slow when fast hits end) |
| Detect cycle | 1 | 2 | Cycle existence |
| Find k-th from end | start after k steps | start from head | k-th node from end |
| Check palindrome | 1 (+ reverse second half) | 2 | Find middle, then compare |

## Arrays vs linked lists

| Operation | Array | Linked list |
|---|---|---|
| Access by index | $O(1)$ | $O(n)$ |
| Insert at front | $O(n)$ | $O(1)$ |
| Insert at end | $O(1)$ amortized | $O(1)$ with tail pointer |
| Insert at position | $O(n)$ | $O(1)$ after traversal |
| Delete at position | $O(n)$ | $O(1)$ after traversal |
| Cache locality | Excellent | Poor |
| Memory overhead | None | 1 pointer per node |

In practice, arrays almost always win due to cache locality. Linked lists are useful when you need frequent insertion/deletion at arbitrary positions and you already have a reference to the node.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Reversal | $O(n)$ | $O(1)$ iterative, $O(n)$ recursive |
| Cycle detection | $O(n)$ | $O(1)$ |
| Merge sorted | $O(n + m)$ | $O(1)$ (rewire pointers) |
| Find middle | $O(n)$ | $O(1)$ |

## Key takeaways

- **Reversal** is the most fundamental operation — master the 3-pointer iterative technique (prev, curr, next) until it's automatic
- **Floyd's cycle detection** uses $O(1)$ space with two pointers at different speeds; always the interview follow-up after the hash set approach
- The **dummy node trick** eliminates edge cases when building or merging lists — use it by default
- **Fast/slow pointer** is a versatile pattern: find middle, detect cycles, check palindromes, find k-th from end
- Linked lists rarely beat arrays in practice due to **poor cache locality**, but excel at frequent insertion/deletion at known positions

## Practice problems

| Problem | Difficulty | Key idea |
|---|---|---|
| [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | 🟢 Easy | Iterative 3-pointer reversal pattern |
| [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | 🟢 Easy | Floyd's tortoise and hare for O(1) space detection |
| [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | 🟢 Easy | Dummy node with two-pointer merge |
| [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | 🟡 Medium | Two pointers with a gap of n nodes |
| [LRU Cache](https://leetcode.com/problems/lru-cache/) | 🟡 Medium | Doubly linked list plus hash map for O(1) access and eviction |

## Relation to other topics

- **Two pointers** — fast/slow pointer on linked lists is a specialized form of the two-pointer technique used on arrays
- **Merge sort** — merge sort is the ideal sorting algorithm for linked lists because it needs only sequential access and $O(1)$ extra space
- **Hash maps** — combining linked lists with hash maps (as in LRU Cache) gives $O(1)$ ordered insertion, deletion, and lookup
