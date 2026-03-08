---
title: "Clipping"
description: "Trim geometry to the visible region so later stages only process the portion that can actually contribute to the frame."
date: 2026-03-07
tags: ["graphics", "geometry", "visibility", "pipeline"]
draft: false
visualization: "ClippingVisualization"
family: "geometry"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["image-processing-fundamentals"]
related: ["rasterization", "bezier-curves"]
enables: ["rasterization"]
---

## Problem

Geometry frequently extends beyond the viewport or clip volume. If you rasterize it as-is, later stages waste work and may even become numerically awkward.

## Intuition

Clipping intersects the primitive with the visible region. The result is a new primitive that lies entirely inside the allowed domain, so downstream stages can assume cleaner inputs.

## Core idea

- Represent the visible region as a clip rectangle or clip volume.
- Intersect the incoming line, polygon, or curve segment with that region.
- Keep only the portion that remains inside.

## Worked example

A line segment that exits the left side of the screen is clipped so the new segment starts exactly on the boundary instead of extending off-screen forever.

## Complexity

The cost depends on the primitive type, but classic line and polygon clipping algorithms are modest compared to the work saved downstream.

## When to choose it

- Choose clipping before rasterization whenever primitives can cross the visible boundary.
- It is a geometric preprocessing stage, not a fragment-level visibility test like the z-buffer.
- Curves and paths also benefit from being clipped before tessellation or rasterization.

## Key takeaways

- Clipping reduces work and simplifies later pipeline stages.
- It happens before rasterization, not instead of it.
- The output remains geometry, just trimmed to the visible domain.
- It is a foundational step in the standard rendering pipeline.

## Practice ideas

- Implement Cohen-Sutherland or Liang-Barsky line clipping.
- Clip a polygon to a rectangle before rasterizing it.
- Visualize the difference between unclipped and clipped primitives on a small screen grid.

## Relation to other topics

- Rasterization assumes geometry that is already ready for screen-space coverage testing.
- Bezier curves often need clipping or subdivision before later rendering steps.
- The z-buffer only matters after geometry has been clipped and rasterized into fragments.
