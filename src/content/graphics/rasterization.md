---
title: "Rasterization"
description: "Turn geometric primitives such as triangles into covered screen pixels so the rendering pipeline can shade actual fragments."
date: 2026-03-07
tags: ["graphics", "rendering", "triangles", "pipeline"]
draft: false
visualization: "RasterizationVisualization"
family: "rendering"
kind: "algorithm"
difficulty: "intro"
prerequisites: ["clipping"]
related: ["barycentric-interpolation", "z-buffer", "ray-marching-sdf"]
enables: ["barycentric-interpolation", "z-buffer", "shadow-mapping"]
---

## Problem

The GPU can shade pixels, but scenes start as geometry. You need a rule that decides which screen pixels a triangle covers before any fragment-level work can happen.

## Intuition

Rasterization projects primitives onto the screen and marks the covered samples. Once you know coverage, later stages can interpolate attributes and decide visibility.

## Core idea

- Clip geometry to the visible region.
- Project the primitive into screen space.
- Test which pixels or samples fall inside the projected triangle, often with edge functions.
- Emit fragments for covered samples so later stages can shade them.

## Worked example

A triangle with three projected screen-space vertices becomes a small set of covered pixels on a discrete grid. Rasterization is the stage that says exactly which pixels belong to it.

## Complexity

The work scales with the number of generated fragments rather than just the number of input triangles. Small triangles are cheap; large on-screen triangles produce many fragments.

## When to choose it

- Choose rasterization for the mainstream real-time triangle pipeline.
- Choose ray marching when the scene is naturally described by implicit distance fields instead of explicit triangles.
- Clipping comes before rasterization because off-screen geometry should be trimmed first.

## Key takeaways

- Rasterization turns primitives into candidate screen samples.
- It is the bridge from geometry to pixel-level shading.
- Coverage, interpolation, and depth testing all build on it.
- Most real-time rendering still centers around rasterized triangles.

## Practice ideas

- Write a software triangle rasterizer on a small grid.
- Inspect how moving a vertex changes the set of covered pixels.
- Add barycentric interpolation after basic coverage works.

## Relation to other topics

- Clipping trims primitives before rasterization begins.
- Barycentric interpolation supplies per-fragment attributes once coverage is known.
- The z-buffer decides which rasterized fragment remains visible at each pixel.
