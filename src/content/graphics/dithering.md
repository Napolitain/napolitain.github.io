---
title: "Dithering"
description: "Trade spatial noise for perceived smoothness when the output format cannot represent all the shades you want directly."
date: 2026-03-07
tags: ["graphics", "color", "quantization", "output"]
draft: false
visualization: "DitheringVisualization"
family: "color"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["gamma-correction", "tone-mapping"]
related: ["histogram-equalization", "alpha-compositing"]
enables: []
---

## Problem

A gradient can look perfectly smooth in a high-precision buffer but break into obvious bands when stored with fewer levels or mapped to a tiny palette.

## Intuition

Dithering deliberately scatters error or patterning across neighboring pixels so the eye perceives intermediate shades that the hardware or format cannot represent directly.

## Core idea

- Quantize each pixel to the available levels or palette.
- Either compare against an ordered threshold pattern or spread the quantization error into neighbors.
- Let the viewer integrate the resulting spatial noise into a smoother perceived tone.

## Worked example

A black-to-white ramp rendered with only a handful of gray levels bands badly without dithering. With a Bayer pattern or error diffusion, the same ramp looks much smoother from normal viewing distance.

## Complexity

Ordered dithering is constant work per pixel. Error-diffusion methods are still linear in the number of pixels but require carrying local quantization error forward.

## When to choose it

- Choose it when output precision or palette size is limited.
- Tone mapping should usually happen first if the scene is still HDR-like.
- Histogram equalization changes contrast; dithering changes how limited output levels are spatially arranged.

## Key takeaways

- Dithering fights banding by adding structured or distributed noise.
- It is most relevant near the end of the pipeline when output precision becomes limited.
- Ordered and error-diffusion variants make different quality and cost trade-offs.
- Good dithering often looks noisy up close and smoother from a normal viewing distance.

## Practice ideas

- Render the same gradient with no dithering, Bayer dithering, and error diffusion.
- Quantize a tone-mapped image to very low bit depth and compare the result with and without dithering.
- Experiment with dithering before and after gamma-aware output conversion.

## Relation to other topics

- Tone mapping and gamma correction usually happen before final dithering decisions.
- Histogram equalization may increase contrast, which can make banding more visible and therefore increase the need for dithering.
- Alpha compositing can produce subtle gradients that later need protection from banding.
