---
title: "Laplacian and Laplacian of Gaussian"
description: "Use second-derivative style filters to emphasize rapid intensity change and zero crossings, often after smoothing first."
date: 2026-03-07
tags: ["graphics", "image-processing", "edges", "second-derivative"]
draft: false
visualization: "LaplacianLogVisualization"
family: "analysis"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["image-processing-fundamentals", "gaussian-blur"]
related: ["sobel-edge-detection", "canny-edge-detection", "bilateral-filter"]
enables: ["canny-edge-detection"]
---

## Problem

Gradient filters tell you how strongly intensity changes in a direction, but sometimes you care about curvature and zero crossings instead: where the signal bends through a sharp transition after noise has been tamed.

## Intuition

The Laplacian is a second derivative. It becomes large when local intensity bends rapidly. Because second derivatives amplify noise, a common practical version is LoG: blur first, then apply the Laplacian.

## Core idea

- Apply a Laplacian kernel such as a 3 x 3 stencil with a strong negative center and positive neighbors.
- For the LoG variant, smooth the image first with a Gaussian kernel before applying the second-derivative pass.
- Inspect the response directly or look for zero crossings around strong responses.

## Worked example

On a blurry bright blob against a dark background, the Laplacian becomes positive on one side of the transition and negative on the other. That sign change is often the useful signal rather than the raw magnitude alone.

## Complexity

A small fixed Laplacian kernel is O(WH). LoG adds the blur step first, so the full pipeline cost is the blur plus one Laplacian pass.

## When to choose it

- Choose it when second-derivative behavior or blob-style structure matters.
- Choose Sobel when a simpler gradient magnitude map is sufficient.
- Choose Canny when the final output should be a carefully thinned edge map rather than an intermediate response.

## Key takeaways

- The Laplacian is a second-derivative operator.
- It is noise-sensitive, so smoothing first is often the practical move.
- LoG is best understood as blur plus curvature-sensitive edge emphasis.
- It complements, rather than replaces, first-derivative operators such as Sobel.

## Practice ideas

- Run Sobel and Laplacian on the same image and compare what each one highlights.
- Toggle a Gaussian pre-blur and inspect how noisy the raw Laplacian becomes without it.
- Look for zero crossings instead of only bright magnitude responses.

## Relation to other topics

- Gaussian blur is the usual stabilizing pre-step for LoG.
- Sobel measures first-derivative gradients rather than second-derivative curvature.
- Canny turns gradient logic into a multi-stage edge pipeline with suppression and hysteresis.
