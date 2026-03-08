---
title: "Bilinear and Bicubic Interpolation"
description: "Reconstruct values between samples when resizing or sampling images, with different trade-offs between cost and smoothness."
date: 2026-03-07
tags: ["graphics", "sampling", "resizing", "textures"]
draft: false
visualization: "BilinearBicubicVisualization"
family: "sampling"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["image-processing-fundamentals"]
related: ["mipmaps", "color-spaces"]
enables: ["mipmaps"]
---

## Problem

Images and textures are sampled on discrete grids, but rendering and resizing rarely land exactly on those original sample points. You need a reconstruction rule for the in-between values.

## Intuition

Nearest-neighbor just picks the closest sample. Bilinear interpolation blends the nearest 2 x 2 neighborhood. Bicubic interpolation uses a wider neighborhood so the result can look smoother and often sharper, at extra cost.

## Core idea

- For bilinear interpolation, locate the four nearest samples and blend first in one axis, then the other.
- For bicubic interpolation, evaluate a cubic reconstruction over a larger support such as 4 x 4 samples.
- The bigger support captures more local shape but costs more work per result pixel.

## Worked example

Upscaling pixel art with nearest-neighbor keeps hard blocks. Bilinear softens the block edges. Bicubic tends to produce smoother gradients and less visibly piecewise transitions, though it may also overshoot in some settings.

## Complexity

Both methods are constant work per output pixel, but bilinear uses four samples while bicubic uses a wider neighborhood and more arithmetic.

## When to choose it

- Choose bilinear as a common default when you want smooth, cheap reconstruction.
- Choose bicubic when you can afford more samples for a smoother upscale or reconstruction.
- Choose mipmaps when the problem is minification stability across scale, not just single-scale interpolation quality.

## Key takeaways

- Interpolation is the rule that fills in values between known samples.
- Bilinear is cheap and smooth enough for many tasks.
- Bicubic uses more context and often yields a higher-quality upscale.
- Sampling quality and mip selection are related but distinct questions.

## Practice ideas

- Upscale the same low-resolution image with nearest, bilinear, and bicubic reconstruction.
- Inspect which method keeps gradients smoother and which one preserves hard blocks more faithfully.
- Combine interpolation with gamma-aware processing and compare the result to naive interpolation in display space.

## Relation to other topics

- Mipmaps solve the scale-selection problem that often appears before interpolation even begins.
- Color spaces and gamma matter because interpolation should ideally happen in an appropriate numeric space.
- Texture sampling in real renderers combines interpolation with filtering across multiple mip levels.
