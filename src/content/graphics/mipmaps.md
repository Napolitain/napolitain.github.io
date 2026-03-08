---
title: "Mipmaps"
description: "Precompute lower-resolution versions of a texture so minified sampling becomes far less aliased and unstable."
date: 2026-03-07
tags: ["graphics", "sampling", "textures", "aliasing"]
draft: false
visualization: "MipmapsVisualization"
family: "sampling"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["bilinear-bicubic-interpolation"]
related: ["taa", "gamma-correction"]
enables: ["taa"]
---

## Problem

A texture can contain far more detail than one screen pixel can display. If you sample the full-resolution texture directly while it shrinks on screen, the result shimmers, aliases, and crawls.

## Intuition

Mipmaps build an image pyramid. Each level is a lower-resolution, prefiltered version of the one before it. When a texture is minified, sample from a level that roughly matches the screen footprint instead of forcing one pixel to decide among huge high-frequency detail.

## Core idea

- Generate a chain of half-resolution images until the texture becomes tiny.
- Estimate the texture footprint in screen space at sample time.
- Choose one mip level or blend between adjacent levels before applying ordinary interpolation within that level.

## Worked example

A dense checkerboard viewed far away will shimmer if sampled only from its highest-resolution level. With mipmaps, the renderer switches to a pre-averaged level so the distant surface looks stable instead of flickering.

## Complexity

Mip generation costs extra memory and preprocessing, but lookup remains constant-time per sample once the pyramid exists.

## When to choose it

- Choose mipmaps whenever textures can become much smaller on screen than their native resolution.
- Bilinear or bicubic interpolation alone is not enough when the source is being strongly minified.
- Use temporal AA later when some instability remains after good spatial filtering and mip selection.

## Key takeaways

- Mipmaps fight minification aliasing by changing the source scale before interpolation.
- They are a scale-selection tool, not merely another interpolation mode.
- They greatly reduce shimmer on textured surfaces.
- Real-time rendering pipelines almost always rely on them for texture stability.

## Practice ideas

- Render a repeated checkerboard with and without mipmaps while shrinking it on screen.
- Inspect which mip level is chosen at several viewing distances.
- Compare remaining shimmer with and without a temporal stabilizer such as TAA.

## Relation to other topics

- Interpolation determines how one mip level is sampled once chosen.
- Gamma-aware filtering matters when building or sampling color textures.
- TAA can complement mipmaps when temporal instability survives after proper texture filtering.
