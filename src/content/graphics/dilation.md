---
title: "Dilation"
description: "Grow foreground regions in a binary mask so gaps close and thin structures get thicker."
date: 2026-03-07
tags: ["graphics", "image-processing", "morphology", "mask", "webgpu"]
draft: false
visualization: "DilationVisualization"
family: "morphology"
kind: "algorithm"
difficulty: "intro"
prerequisites: ["image-processing-fundamentals", "thresholding"]
related: ["erosion", "opening-closing"]
enables: ["opening-closing"]
---

## Problem

A binary mask is often almost correct but not quite:

- tiny gaps split a region in two
- lines are thinner than they should be
- nearby foreground pieces fail to touch

You want to grow the foreground outward in a controlled way.

## Intuition

Dilation asks:

> Does this pixel have any foreground neighbor inside the structuring element?

If the answer is yes, the output becomes foreground.

So dilation behaves like a local **max** over a binary mask.

## The operator

Using a 3 x 3 structuring element, each output pixel becomes 1 if **any** pixel in that neighborhood is 1.

In pseudocode:

```text
output[x, y] = 1 if any input neighbor in the window is 1
```

That causes bright regions to expand outward.

## Worked example

Suppose a 1D mask is:

```text
0 0 1 0 0
```

With a radius-1 dilation, the foreground grows:

```text
0 1 1 1 0
```

In 2D, the same effect thickens shapes and can bridge narrow gaps.

## What dilation is good at

- reconnecting nearly-touching regions
- thickening thin lines
- filling tiny breaks
- making later selection logic less fragile

But dilation also has a cost: it can overgrow objects and blur their binary boundaries outward.

## Complexity

For an image with $W \times H$ pixels and a structuring element of size $k \times k$:

- direct dilation costs $O(WHk^2)$

For small fixed kernels, that is often perfectly practical.

## GPU implementation note

Dilation maps cleanly to WebGPU:

- each output pixel checks a local neighborhood
- there are no cross-pixel dependencies beyond that neighborhood
- the operator is effectively a local max on binary values

That makes it easy to animate the effect of increasing the morphology radius.

## When to choose it

Choose dilation when:

- foreground regions should expand
- tiny gaps should seal
- thin structures should be reinforced

Choose something else when:

- the mask is already too thick
- small bright noise should disappear rather than spread
- you need a more selective two-step cleanup

## Key takeaways

- Dilation grows foreground regions
- It is the binary-mask counterpart of a local max
- It is excellent for closing tiny breaks, but it can also overgrow shapes
- Dilation is one of the two primitive morphology operators
- Composite tools such as closing are built from it

## Practice ideas

- Dilate a sparse mask with radius 1, 2, and 3 and note when separate components merge
- Compare direct dilation with closing on a mask that has both narrow gaps and isolated noise
- Build a threshold -> dilation pipeline and describe what gets fixed and what gets worse

## Relation to other topics

- **Thresholding** often produces the mask that dilation then repairs
- **Erosion** is the opposite primitive: it shrinks foreground rather than grows it
- **Opening and closing** combine dilation and erosion to solve more targeted cleanup problems
