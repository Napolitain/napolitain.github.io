---
title: "Skeletonization"
description: "Reduce a thick binary shape to a thin centerline while trying to preserve its topology."
date: 2026-03-07
tags: ["graphics", "image-processing", "morphology", "shape"]
draft: false
visualization: "SkeletonizationVisualization"
family: "morphology"
kind: "technique"
difficulty: "advanced"
prerequisites: ["distance-transform", "erosion", "connected-components-labeling"]
related: ["opening-closing", "distance-transform"]
enables: []
---

## Problem

A mask may contain a useful shape, but the full thick region is not always the representation you want. Sometimes the informative object is the centerline: roads, vessels, strokes, or elongated structures.

## Intuition

Skeletonization repeatedly removes boundary pixels that are not structurally essential, trying to leave behind a one-pixel-wide representation that preserves connectivity and general shape layout.

## Core idea

- Start from a cleaned binary mask.
- Iteratively remove boundary pixels according to a thinning rule, but only when doing so does not break connectivity.
- Continue until no more removable pixels remain, or derive the skeleton from ridges in a distance field.

## Worked example

A thick handwritten stroke can be thinned to a single-pixel path that still follows the original trajectory. The width disappears, but the topology and centerline remain.

## Complexity

Iterative thinning depends on the number of passes, but each pass is linear in the number of pixels. Distance-field-based approaches often pay for the distance transform first, then extract centerline structure.

## When to choose it

- Choose it when centerlines or graph-like structure matter more than filled area.
- Use opening and closing first if the mask still contains holes or isolated junk.
- Use a distance transform when you need thickness values directly rather than only the final skeleton.

## Key takeaways

- Skeletonization is topology-aware thinning.
- The goal is not just making the mask smaller, but preserving structure.
- Clean input masks matter a lot because noise creates ugly skeleton branches.
- Distance transforms and thinning algorithms are two common roads to a skeleton.

## Practice ideas

- Skeletonize a thick shape before and after opening/closing to see how cleanup changes spurious branches.
- Compare a thinning-based skeleton with the ridge structure of a distance transform.
- Measure path length on the skeleton rather than on the full mask.

## Relation to other topics

- Distance transforms expose the medial structure that skeletons try to keep.
- Erosion shrinks shapes but does not preserve centerline structure on its own.
- Connected-components labeling can isolate the object you want before skeletonizing it.
