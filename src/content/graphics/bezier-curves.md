---
title: "Bezier Curves"
description: "Describe smooth parametric curves with control points so paths and shapes can be edited intuitively."
date: 2026-03-07
tags: ["graphics", "geometry", "curves", "parametric"]
draft: false
visualization: "BezierCurvesVisualization"
family: "geometry"
kind: "technique"
difficulty: "intro"
prerequisites: ["image-processing-fundamentals"]
related: ["clipping", "rasterization", "ray-marching-sdf"]
enables: []
---

## Problem

Straight segments are simple, but many graphics tasks need smooth editable paths: vector art, fonts, motion paths, and curve-based modeling.

## Intuition

A Bezier curve is controlled by a handful of points. You do not usually set every point on the final curve directly; instead you position the control points and let the curve interpolate them in a structured way.

## Core idea

- Use linear interpolation recursively between control points, as in de Casteljau’s algorithm.
- For a cubic Bezier, four control points define the curve.
- Evaluating the curve at parameter t in [0, 1] gives one point on the final path.

## Worked example

Move one middle control point of a cubic Bezier and the whole curve bends smoothly without changing the endpoints. That is why Bezier control is so intuitive in editors.

## Complexity

Evaluating a curve point is constant work for a fixed degree. Rendering the whole curve depends on how many samples or line segments you use to approximate it.

## When to choose it

- Choose Bezier curves when smooth, editable parametric paths matter.
- Choose rasterization after the curve has been sampled or tessellated into drawable primitives.
- Choose ray-marched SDFs later if you want to render shape logic from an implicit field instead of explicit sampled geometry.

## Key takeaways

- Bezier curves trade direct point editing for intuitive control-point editing.
- De Casteljau interpolation gives both evaluation and geometric intuition.
- Curves are usually sampled or tessellated before raster rendering.
- They are foundational in vector graphics, fonts, and motion design.

## Practice ideas

- Implement de Casteljau’s algorithm for a cubic Bezier.
- Visualize the intermediate interpolation segments as t moves from 0 to 1.
- Approximate a Bezier curve with line segments and rasterize the result.

## Relation to other topics

- Clipping may be needed before or after curve tessellation depending on the pipeline.
- Rasterization eventually turns a sampled curve representation into pixels.
- Ray marching with SDFs is a very different representation choice for smooth shapes.
