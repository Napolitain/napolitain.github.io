---
title: "Barycentric Interpolation"
description: "Blend per-vertex attributes across a triangle so every covered fragment gets a sensible color, depth, or texture coordinate."
date: 2026-03-07
tags: ["graphics", "rendering", "interpolation", "triangles"]
draft: false
visualization: "BarycentricInterpolationVisualization"
family: "rendering"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["rasterization"]
related: ["z-buffer", "color-spaces"]
enables: ["z-buffer", "shadow-mapping"]
---

## Problem

Rasterization tells you which pixels lie inside a triangle, but those pixels still need attributes such as color, UV coordinates, or depth values that vary smoothly across the primitive.

## Intuition

Barycentric coordinates express any point inside a triangle as weights on the three vertices. Because those weights sum to one, they naturally interpolate per-vertex data across the interior.

## Core idea

- Compute the barycentric weights for the fragment relative to the triangle vertices.
- Use those weights to blend vertex attributes such as color, depth, normals, or texture coordinates.
- Feed the interpolated attributes into later shading and visibility logic.

## Worked example

If one vertex is red, one is green, and one is blue, barycentric interpolation produces a smooth color gradient across the triangle where each pixel inherits a different mixture of those three endpoints.

## Complexity

The math is constant work per fragment, which is why it fits naturally inside the raster pipeline.

## When to choose it

- Choose it whenever triangle interiors need smoothly varying per-vertex data.
- Perspective-correct interpolation becomes important when the interpolated attributes live in projected geometry rather than pure screen space.
- The technique only makes sense after rasterization has already identified covered fragments.

## Key takeaways

- Barycentric weights sum to one and stay local to the triangle.
- They are the standard way to interpolate triangle attributes.
- Color, depth, normals, and UVs all rely on the same core idea.
- They are a foundational concept for understanding fragment shading.

## Practice ideas

- Interpolate vertex colors across a software-rasterized triangle.
- Display the three barycentric weights directly as RGB channels.
- Compare naive linear interpolation with perspective-correct interpolation on textured geometry.

## Relation to other topics

- Rasterization identifies the fragments barycentric interpolation operates on.
- The z-buffer often uses interpolated depth from the same weights.
- Shadow mapping later reuses interpolated coordinates in another projected space.
