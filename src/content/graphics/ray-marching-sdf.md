---
title: "Ray Marching and Signed Distance Fields"
description: "Render implicit shapes by stepping along a ray according to the nearest safe distance reported by an SDF."
date: 2026-03-07
tags: ["graphics", "rendering", "sdf", "procedural"]
draft: false
visualization: "RayMarchingSdfVisualization"
family: "rendering"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["image-processing-fundamentals"]
related: ["rasterization", "bezier-curves", "shadow-mapping"]
enables: []
---

## Problem

Triangles are not the only way to describe geometry. Procedural and implicit scenes can be easier to express as distance-to-surface functions, but then the renderer needs a different strategy to find hits.

## Intuition

A signed distance field tells you how far you are from the nearest surface, with sign indicating inside versus outside. Ray marching uses that value as a safe step size, advancing along the ray until the distance becomes tiny enough to count as a hit.

## Core idea

- Cast a ray through the scene.
- Query the SDF at the current point to get a conservative step size.
- Advance by that step and repeat until you either hit the surface or exceed a maximum distance or step count.
- Estimate normals from the SDF nearby once you have a hit point.

## Worked example

A circle or rounded box can be described analytically by an SDF. Ray marching repeatedly jumps toward the surface, often requiring only a modest number of steps when the field is well-behaved.

## Complexity

The cost depends on the number of steps per ray, which depends on scene structure, epsilon thresholds, and maximum distance limits. It is not as predictably fixed as triangle rasterization.

## When to choose it

- Choose it for implicit or procedural scenes where SDFs are a natural representation.
- Choose rasterization for traditional triangle-heavy real-time pipelines.
- It is great for smooth constructive shape logic, but not a drop-in replacement for every geometry workflow.

## Key takeaways

- Ray marching relies on the distance field to pick safe step sizes.
- SDFs make constructive implicit modeling elegant.
- The method can produce beautiful procedural results with relatively compact code.
- Its performance profile depends on how many steps rays need to converge.

## Practice ideas

- Implement a 2D ray marcher for circles and boxes.
- Estimate normals from the SDF and add simple shading.
- Compare the representation trade-off between a triangle scene and an implicit SDF scene.

## Relation to other topics

- Rasterization is the mainstream explicit-geometry alternative.
- Bezier curves describe explicit parametric geometry, not implicit distance fields.
- Shadow logic can also be phrased in ray-marched terms for SDF scenes, though the tooling differs from shadow mapping.
