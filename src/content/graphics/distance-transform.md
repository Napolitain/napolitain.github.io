---
title: "Distance Transform"
description: "For every foreground pixel, compute how far it sits from the background or boundary so the mask gains geometric thickness information."
date: 2026-03-07
tags: ["graphics", "image-processing", "distance", "mask"]
draft: false
visualization: "DistanceTransformVisualization"
family: "analysis"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["thresholding", "connected-components-labeling"]
related: ["skeletonization", "erosion", "flood-fill"]
enables: ["skeletonization"]
---

## Problem

A binary mask tells you inside versus outside, but not how deep a pixel lies inside the shape. Many geometric tasks need that notion of thickness or clearance.

## Intuition

The distance transform replaces each foreground pixel with the distance to the nearest background pixel. Pixels near the boundary get small values, while deep interior pixels get larger ones.

## Core idea

- Start from the boundary or all background pixels as distance zero.
- Propagate nearest-boundary information inward, using a metric such as Manhattan, chessboard, or Euclidean distance.
- Store the smallest distance found for each foreground pixel.

## Worked example

On a thick bar shape, the centerline pixels receive the largest distances because they are farthest from either edge. That is why distance transforms often reveal the medial structure of a shape.

## Complexity

The naive all-pairs view is expensive, but practical transforms can be computed in linear or near-linear time depending on the metric and algorithm.

## When to choose it

- Choose it when interior thickness, clearance, or nearest-boundary information matters.
- Choose component labeling when object IDs are the missing structure rather than geometric depth.
- Choose skeletonization when the final goal is a thin centerline rather than a full distance field.

## Key takeaways

- Distance transforms turn a binary mask into a geometric field.
- They are a natural bridge from segmentation into measurement and medial-axis reasoning.
- The chosen distance metric changes the shape of the result.
- They are frequently used before skeleton extraction or path planning on masks.

## Practice ideas

- Compute a distance transform on a simple shape and identify the pixels with maximal distance.
- Compare Manhattan and Euclidean distance fields on the same mask.
- Use the distance field to estimate local thickness across a segmented object.

## Relation to other topics

- Connected-components labeling identifies objects; distance transforms describe their geometry internally.
- Erosion can be understood as repeatedly peeling away boundary layers, which is closely related to distance depth.
- Skeletonization often keeps points that are structurally central with respect to the distance field.
