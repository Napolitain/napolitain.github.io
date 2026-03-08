---
title: "Flood Fill"
description: "Grow one connected region from a seed pixel, making it the canonical seeded region-growing primitive."
date: 2026-03-07
tags: ["graphics", "image-processing", "region-growing", "mask"]
draft: false
visualization: "FloodFillVisualization"
family: "analysis"
kind: "algorithm"
difficulty: "intro"
prerequisites: ["image-processing-fundamentals", "thresholding"]
related: ["connected-components-labeling", "dilation"]
enables: ["connected-components-labeling"]
---

## Problem

Sometimes you do not want every object in the mask. You want the region that contains one chosen seed, like a bucket fill tool or a seeded segmentation pass.

## Intuition

Flood fill is just graph traversal on the pixel grid. Starting from one seed, you visit all neighboring pixels that satisfy the region rule and stop when the region boundary blocks expansion.

## Core idea

- Choose a seed pixel.
- Use BFS or DFS over 4-neighbor or 8-neighbor connectivity.
- Only expand into pixels that match the allowed condition, such as the same label or being inside the foreground mask.
- Mark every reached pixel as belonging to the filled region.

## Worked example

A paint-bucket tool in an editor starts from one click, then floods through all connected pixels that still belong to the same area. That is flood fill in its purest form.

## Complexity

Flood fill is O(size of the reached region) and O(WH) in the worst case if the region spans the whole image.

## When to choose it

- Choose it when the input provides a meaningful seed.
- Choose component labeling when you need all connected regions, not just one.
- Choose dilation when the goal is morphological growth of a mask rather than seeded traversal.

## Key takeaways

- Flood fill is graph traversal on an image grid.
- The connectivity rule and the region-membership rule both matter.
- It is the seeded cousin of connected-components labeling.
- It shows up everywhere from paint tools to seeded segmentation and mask editing.

## Practice ideas

- Implement 4-neighbor and 8-neighbor flood fill and compare the difference on diagonally touching pixels.
- Use flood fill to keep only the component that contains a chosen seed.
- Combine thresholding and flood fill to segment one object from a simple grayscale scene.

## Relation to other topics

- Connected-components labeling generalizes flood fill from one seed to every region in the image.
- Thresholding often creates the binary mask flood fill expands through.
- Dilation changes the shape of the mask globally, whereas flood fill traverses an existing shape from a seed.
