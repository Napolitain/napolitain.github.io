---
title: "Shadow Mapping"
description: "Use a depth map from the light’s point of view to decide whether a visible surface point is blocked from that light."
date: 2026-03-07
tags: ["graphics", "lighting", "shadows", "depth"]
draft: false
visualization: "ShadowMappingVisualization"
family: "lighting"
kind: "technique"
difficulty: "advanced"
prerequisites: ["rasterization", "barycentric-interpolation", "z-buffer"]
related: ["ssao", "ray-marching-sdf"]
enables: ["ssao", "bloom"]
---

## Problem

Primary visibility from the camera is not enough for lighting. A point can be visible to the camera yet hidden from the light source, which is exactly what a shadow is.

## Intuition

Render the scene from the light first and keep its depth buffer. Later, when shading from the camera view, transform each visible point into light space and ask whether something else reached that light-space pixel first.

## Core idea

- Render depth from the light’s point of view into a shadow map.
- During camera shading, transform the current surface point into that same light-space coordinate system.
- Compare the point’s light-space depth against the stored shadow-map depth.
- If the point is farther away than the stored depth, something occluded it and the point is shadowed.

## Worked example

A floor point may be fully visible to the camera, but when projected into light space its depth falls behind the depth stored for a wall or cube. That mismatch reveals that the light cannot see it directly.

## Complexity

Shadow mapping adds another scene render from the light plus per-fragment lookup and comparison in the camera pass. It is usually far cheaper than full geometric shadow queries for every shaded point.

## When to choose it

- Choose it for real-time shadowing in raster pipelines.
- Choose SSAO when you only need a cheap local occlusion cue rather than directional shadowing.
- Ray-marched scenes may use other visibility strategies, though the conceptual depth comparison still echoes here.

## Key takeaways

- Shadow mapping is depth testing from the light’s perspective.
- Bias and filtering matter because naive comparisons cause artifacts such as acne or jagged edges.
- It is a standard, practical real-time shadow technique.
- Understanding the z-buffer makes shadow mapping much easier to reason about.

## Practice ideas

- Render a simple scene and visualize the shadow map directly.
- Adjust depth bias and inspect acne versus peter-panning artifacts.
- Compare hard shadow-map sampling with a simple filtered variant.

## Relation to other topics

- The z-buffer provides the core visibility intuition reused here from another viewpoint.
- Barycentric interpolation and rasterization still provide the fragment positions and depth context.
- SSAO is a different, screen-space approximation of darkness that does not replace true light visibility.
