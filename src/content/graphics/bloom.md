---
title: "Bloom"
description: "Make bright highlights glow by extracting them, blurring them, and compositing the result back onto the base frame."
date: 2026-03-07
tags: ["graphics", "post-processing", "glow", "lighting"]
draft: false
visualization: "BloomVisualization"
family: "post-processing"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["gaussian-blur", "tone-mapping", "alpha-compositing"]
related: ["taa", "ssao", "shadow-mapping"]
enables: ["taa"]
---

## Problem

Bright highlights often look unnaturally hard-edged in a raw render. Real optical systems and many stylized pipelines spread some of that energy into neighboring pixels.

## Intuition

Bloom isolates bright regions, blurs them, then adds or composites the blurred result back over the image. The blur converts a tiny intense highlight into a larger soft halo.

## Core idea

- Threshold or otherwise extract the bright parts of the frame.
- Blur that bright-pass image, often at one or several scales.
- Composite the blurred glow back onto the base frame with a chosen intensity.

## Worked example

A small emissive sign may be only a handful of pixels wide in the base render. After bloom, it emits a soft surrounding halo that makes it feel brighter and more cinematic.

## Complexity

Bloom is usually several full-screen passes: extraction, blur, and composition. The cost depends on blur radius, resolution, and how many levels or scales you use.

## When to choose it

- Choose it when bright highlights should feel like they spill light into nearby pixels.
- Tone mapping should already have handled the main HDR compression before bloom is tuned artistically.
- Choose TAA later when the main issue is flicker and instability, not missing glow.

## Key takeaways

- Bloom is post-processing based on bright-pass extraction and blur.
- It is closely tied to tone and dynamic-range decisions.
- It produces a halo effect rather than changing object visibility or geometry.
- Its final step is a compositing operation back onto the original frame.

## Practice ideas

- Implement a bright-pass plus separable blur bloom pipeline.
- Compare bloom with different thresholds and intensities on the same frame.
- Inspect the difference between blooming before and after tone-mapping choices are finalized.

## Relation to other topics

- Gaussian blur is the smoothing engine inside bloom.
- Tone mapping shapes the base image that bloom is layered onto.
- Alpha compositing or additive blending returns the blurred glow to the final frame.
