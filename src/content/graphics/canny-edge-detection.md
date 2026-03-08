---
title: "Canny Edge Detection"
description: "Build a cleaner final edge map by chaining smoothing, gradients, non-maximum suppression, and hysteresis thresholding."
date: 2026-03-07
tags: ["graphics", "image-processing", "edges", "pipeline"]
draft: false
visualization: "CannyEdgeVisualization"
family: "analysis"
kind: "algorithm"
difficulty: "advanced"
prerequisites: ["gaussian-blur", "sobel-edge-detection", "thresholding"]
related: ["laplacian-log", "connected-components-labeling"]
enables: ["connected-components-labeling"]
---

## Problem

A raw edge response is usually too thick, too noisy, and too ambiguous to serve as a final contour map. You need a full pipeline that turns edge evidence into stable, thin boundaries.

## Intuition

Canny is not one kernel. It is a sequence: denoise first, compute gradients, suppress non-maxima so only local ridge peaks remain, then keep weak edges only when they connect to strong ones.

## Core idea

- Smooth the image, often with a Gaussian blur.
- Compute gradient magnitude and direction, typically with Sobel-like kernels.
- Apply non-maximum suppression so wide gradient ridges become thin candidates.
- Use a high and low threshold with hysteresis so weak edges survive only when attached to strong ones.

## Worked example

A textured but noisy boundary may produce many small gradient responses. Non-maximum suppression thins the ridge, and hysteresis prevents isolated weak specks from surviving while preserving a longer connected contour.

## Complexity

Each stage is linear in the number of pixels, so the full pipeline stays O(WH) with a moderate constant factor from the multiple passes.

## When to choose it

- Choose it when the edge map itself is the final product or an important intermediate artifact.
- Choose Sobel when you only need a quick gradient magnitude visualization.
- Choose thresholding when you want region membership rather than contour extraction.

## Key takeaways

- Canny is a multi-stage detector, not a single stencil.
- Non-maximum suppression and hysteresis are what make it cleaner than a raw gradient map.
- It is a strong default when final contour quality matters.
- Its prerequisites explain its structure: blur, gradients, and threshold logic all appear inside it.

## Practice ideas

- Compare Sobel and Canny on the same noisy image and inspect contour thickness.
- Vary the high and low thresholds and observe when edges fragment or over-connect.
- Feed a Canny result into connected-components labeling to count contour fragments.

## Relation to other topics

- Gaussian blur and Sobel appear as building blocks inside Canny.
- Thresholding contributes the high/low edge decision logic, but in a connected hysteresis form rather than a one-shot mask split.
- Connected-components labeling becomes useful after Canny when you want region or contour-level analysis.
