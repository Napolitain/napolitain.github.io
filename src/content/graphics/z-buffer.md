---
title: "Z-Buffer"
description: "Resolve which fragment is actually visible at each pixel by keeping only the smallest depth seen so far."
date: 2026-03-07
tags: ["graphics", "rendering", "visibility", "depth"]
draft: false
visualization: "ZBufferVisualization"
family: "rendering"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["rasterization", "barycentric-interpolation"]
related: ["shadow-mapping", "ssao"]
enables: ["shadow-mapping", "ssao", "taa"]
---

## Problem

Once multiple triangles cover the same pixel, coverage alone is no longer enough. You still need to know which surface is in front from the camera’s point of view.

## Intuition

The z-buffer stores the best depth seen at each pixel so far. Incoming fragments only survive if they are closer than what the buffer already contains.

## Core idea

- Initialize the depth buffer to the farthest possible depth.
- For each rasterized fragment, compare its depth against the stored value at that pixel.
- If the fragment is closer, update both the color target and the depth buffer.
- Otherwise discard it.

## Worked example

Two triangles overlap on screen. Without depth testing, draw order decides which one appears. With a z-buffer, the triangle that is physically closer at each pixel wins regardless of submission order.

## Complexity

Depth testing is constant work per fragment, but it becomes one of the most performance-critical constant-time decisions in the entire renderer because it happens everywhere.

## When to choose it

- Choose it for primary camera-space visibility in a raster pipeline.
- Choose shadow mapping when you need visibility from a light’s point of view instead.
- Choose SSAO when you want depth-based ambient shading cues rather than front-most surface selection.

## Key takeaways

- The z-buffer solves visibility per screen pixel.
- It removes draw-order dependence for overlapping geometry.
- Interpolated fragment depth feeds directly into the test.
- Many later effects reuse the same depth information for different purposes.

## Practice ideas

- Render two overlapping triangles with and without a z-buffer.
- Visualize the stored depth buffer as a grayscale image.
- Inject a deliberate depth precision issue and inspect the artifact.

## Relation to other topics

- Rasterization and barycentric interpolation deliver the fragments and depths that the z-buffer tests.
- Shadow mapping uses a related idea, but from the light’s perspective.
- SSAO also consumes depth, but for shading rather than primary visibility.
