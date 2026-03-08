---
title: "Opening and Closing"
description: "Compose erosion and dilation to remove bright specks or fill small holes without manually editing the mask."
date: 2026-03-07
tags: ["graphics", "image-processing", "morphology", "mask", "webgpu"]
draft: false
visualization: "OpeningClosingVisualization"
family: "morphology"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["image-processing-fundamentals", "thresholding", "dilation", "erosion"]
related: ["gaussian-blur"]
enables: []
---

## Problem

Single-step dilation and erosion are useful, but often too blunt.

Typical mask defects come in two common forms:

- isolated bright specks that should disappear
- small dark gaps or holes that should be filled

You need a controlled two-step repair, not just unconditional growth or shrinkage.

## Intuition

Opening and closing use the same two primitive operators:

- erosion
- dilation

The entire behavior is decided by the order.

### Opening

```text
opening = erosion -> dilation
```

This removes small bright foreground noise first, then regrows the surviving larger structures.

### Closing

```text
closing = dilation -> erosion
```

This fills small dark holes or narrow breaks first, then shrinks the result back toward its original boundary.

That order difference is the whole story.

## Worked example

### Opening

Suppose a mask contains one large object plus tiny bright specks.

1. Erosion removes the specks entirely and shrinks the large object.
2. Dilation regrows the large object.
3. The specks do not come back because they were erased completely in the first step.

### Closing

Suppose a mask contains a mostly solid region with tiny holes.

1. Dilation grows the foreground so holes and narrow gaps seal.
2. Erosion trims the outside boundary back down.
3. The previously sealed holes stay filled if they were smaller than the structuring element.

## Why opening and closing are not opposites

They use the same two primitives, but they are not interchangeable.

- Opening is biased toward **removing small bright features**
- Closing is biased toward **filling small dark features**

That makes them perfect "choose this over that" topics.

## Complexity

If one morphology pass costs $O(WHk^2)$, then opening or closing costs:

```text
O(2WHk^2)
```

which is still just a constant-factor multiple of the primitive operation.

## GPU implementation note

On WebGPU, opening and closing are naturally expressed as two passes:

1. render the first morphology result into an intermediate texture
2. run the second morphology pass from that intermediate texture into the final target

That makes them a good example of a small multi-pass graphics pipeline rather than a single operator.

## When to choose each

### Choose opening when

- the mask contains isolated bright specks
- thin false positives should disappear
- the foreground should become cleaner, not more connected

### Choose closing when

- the mask contains tiny holes
- boundaries have narrow cracks
- nearly connected regions should fuse

## Key takeaways

- Opening and closing are **two-pass morphology techniques**
- The order determines the effect
- Opening removes small bright noise
- Closing fills small dark gaps and holes
- They are more selective than applying dilation or erosion alone

## Practice ideas

- Build one noisy mask with bright specks and another with small holes, then compare opening and closing on both
- Vary the morphology radius and note the largest defects each operator can still fix
- Implement opening and closing as two WebGPU passes with an intermediate texture

## Relation to other topics

- **Dilation** and **erosion** are the primitive operators opening and closing are built from
- **Thresholding** often produces the mask that later needs opening or closing
- **Gaussian blur** is a continuous-image cleanup step from earlier in the pipeline, not a binary-mask repair tool
