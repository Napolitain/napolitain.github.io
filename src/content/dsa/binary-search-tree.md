---
title: "Binary Search Tree (BST)"
description: "A sorted tree structure enabling O(log n) search, insert, and delete. Foundation for balanced trees, sets, and maps."
date: 2026-03-06
tags: ["tree", "bst", "binary-search", "recursion"]
draft: false
visualization: "BstVisualization"
---

## Problem

Store a dynamic set of elements supporting **search**, **insert**, and **delete** — all in $O(\log n)$ average time — while maintaining sorted order.

## Intuition

A BST is a binary tree where every node satisfies the **BST invariant**: all values in the left subtree are strictly less than the node, and all values in the right subtree are strictly greater. This single rule turns a tree into a searchable structure — at every node you know which half to recurse into, just like binary search on an array, but with the flexibility of a linked structure.

The key insight: binary search requires a sorted array, which makes insertions $O(n)$. A BST gives you the same halving principle in a structure where inserts and deletes are local pointer operations.

## Algorithm

### Search

```
search(node, target):
    if node is null: return null
    if target == node.val: return node
    if target < node.val: return search(node.left, target)
    else: return search(node.right, target)
```

### Insert

```
insert(node, val):
    if node is null: return new Node(val)
    if val < node.val: node.left ← insert(node.left, val)
    else if val > node.val: node.right ← insert(node.right, val)
    return node
```

### Delete (three cases)

```
delete(node, val):
    if node is null: return null
    if val < node.val: node.left ← delete(node.left, val)
    else if val > node.val: node.right ← delete(node.right, val)
    else:
        // Case 1: leaf — just remove
        if node.left is null and node.right is null: return null
        // Case 2: one child — replace with child
        if node.left is null: return node.right
        if node.right is null: return node.left
        // Case 3: two children — replace with inorder successor
        successor ← min(node.right)
        node.val ← successor.val
        node.right ← delete(node.right, successor.val)
    return node
```

### Inorder traversal

```
inorder(node):
    if node is null: return
    inorder(node.left)
    visit(node)
    inorder(node.right)
```

## BST property and its consequences

**Inorder traversal yields sorted order.** This is a direct consequence of the invariant — left subtree (smaller values) is visited first, then the node, then right subtree (larger values). This means you get a free $O(n)$ sort from any BST.

**Successor**: the next larger element is either the leftmost node in the right subtree, or the nearest ancestor where the node is in the left subtree. **Predecessor** is symmetric. Both are $O(h)$ where $h$ is the tree height.

**Min/Max**: follow left (or right) pointers to the end. $O(h)$.

## Balancing

An unbalanced BST degenerates to a linked list. Inserting sorted data $[1, 2, 3, \ldots, n]$ creates a chain of right children — every operation becomes $O(n)$. This is the fundamental weakness of naive BSTs.

Self-balancing variants fix this by enforcing height constraints:

- **AVL trees**: height difference between subtrees $\leq 1$. Strict balance, faster lookups, more rotations on insert/delete.
- **Red-Black trees**: nodes are colored red/black with rules ensuring no path is more than $2\times$ longer than any other. Used in most standard library implementations (`std::map`, `TreeMap`).

Both guarantee $O(\log n)$ height. The details of rotations are important but orthogonal to understanding the BST concept itself.

## Common patterns

**Validate BST**: inorder traversal should be strictly increasing — or recursively pass $(\text{min}, \text{max})$ bounds down the tree.

**Kth smallest element**: augment each node with a subtree size count, or do an inorder traversal with a counter.

**Lowest Common Ancestor (LCA) in BST**: if both values are less than the current node, go left. If both greater, go right. Otherwise, the current node is the LCA. $O(h)$ — simpler than generic tree LCA because the BST invariant tells you which direction to go.

**BST iterator**: use a stack to simulate inorder traversal. Push all left children, pop to get next, then push left children of the right child. Amortized $O(1)$ per `next()` call.

## Complexity

| Operation | Average | Worst (unbalanced) |
|---|---|---|
| Search | $O(\log n)$ | $O(n)$ |
| Insert | $O(\log n)$ | $O(n)$ |
| Delete | $O(\log n)$ | $O(n)$ |
| Inorder | $O(n)$ | $O(n)$ |
| Min/Max | $O(\log n)$ | $O(n)$ |
| Space | $O(n)$ | $O(n)$ |

Balanced variants (AVL, Red-Black) guarantee $O(\log n)$ worst case for search, insert, and delete.

## Relation to other algorithms

**Binary search**: a BST is essentially binary search materialized as a data structure. The array gives you $O(\log n)$ search but $O(n)$ insert; the BST gives you $O(\log n)$ for both.

**Heaps**: both are tree-based, but heaps only guarantee a partial order (parent vs children). BSTs maintain a total order (left < node < right). You can't efficiently search a heap, and you can't efficiently extract-min from a BST without augmentation.

**Balanced BSTs → sets and maps**: virtually every language's sorted set/map (`TreeSet`, `std::set`, `BTreeMap`) is a balanced BST underneath. When you need ordered iteration, range queries, or floor/ceiling operations, you're using a BST.
