---
title: "Erosion"
description: "Shrink foreground regions in a binary mask so thin noise and small protrusions disappear."
date: 2026-03-07
tags: ["graphics", "image-processing", "morphology", "mask", "webgpu"]
draft: false
visualization: "ErosionVisualization"
family: "morphology"
kind: "algorithm"
difficulty: "intro"
prerequisites: ["image-processing-fundamentals", "thresholding"]
related: ["dilation", "opening-closing"]
enables: ["opening-closing"]
---

## Problem

Sometimes the mask error goes in the opposite direction:

- bright specks should disappear
- boundaries are too fat
- tiny protrusions should be trimmed away

You want the foreground to contract rather than expand.

## Intuition

Erosion asks:

> Are all pixels inside the structuring element foreground?

If even one required neighbor is background, the output becomes background.

So erosion behaves like a local **min** over a binary mask.

## The operator

Using a 3 x 3 structuring element, each output pixel becomes 1 only if **every** pixel in that neighborhood is 1.

In pseudocode:

```text
output[x, y] = 1 if all input neighbors in the window are 1
```

That causes bright regions to shrink inward.

## Worked example

Suppose a 1D mask is:

```text
0 1 1 1 0
```

With a radius-1 erosion:

```text
0 0 1 0 0
```

Only the interior survives. Borders contract.

In 2D, that removes thin protrusions and small bright islands quickly.

## What erosion is good at

- removing isolated bright noise
- trimming overly thick masks
- stripping away small protrusions
- preparing for opening

But erosion can also destroy thin legitimate structures if you use too large a radius.

## Complexity

For an image with $W \times H$ pixels and a structuring element of size $k \times k$:

- direct erosion costs $O(WHk^2)$

As with dilation, small fixed kernels are common in practice.

## GPU implementation note

Erosion is the mirror image of dilation in GPU terms:

- each output pixel scans a local window
- the operator reduces the neighborhood with a min-like rule
- radius changes are very easy to expose interactively

So it is a great pair with dilation for teaching morphology.

## When to choose it

Choose erosion when:

- the foreground should shrink
- tiny bright defects should disappear
- object boundaries are too fat

Choose something else when:

- gaps need to close rather than widen
- regions are already thin and fragile
- a one-step shrink is too destructive

## Key takeaways

- Erosion shrinks foreground regions
- It is the binary-mask counterpart of a local min
- It removes small bright structures aggressively
- It is the opposite primitive from dilation
- Opening uses erosion first to remove noise before regrowing the surviving structure

## Practice ideas

- Erode the same mask with multiple radii and note when legitimate thin structures vanish
- Compare erosion and dilation on a mask that contains both holes and bright specks
- Use erosion as the first step of opening, then see why the following dilation does not simply undo everything

## Relation to other topics

- **Thresholding** often creates the mask erosion operates on
- **Dilation** expands masks, while erosion contracts them
- **Opening and closing** combine both primitives, with order determining behavior
