---
title: "Tone Mapping"
description: "Compress HDR-style scene values into a range a normal display can actually show while keeping highlights under control."
date: 2026-03-07
tags: ["graphics", "color", "hdr", "post-processing"]
draft: false
visualization: "ToneMappingVisualization"
family: "color"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["color-spaces", "gamma-correction"]
related: ["bloom", "histogram-equalization", "dithering"]
enables: ["bloom", "dithering"]
---

## Problem

Rendered scenes can contain values far beyond what an ordinary display can show. If you just clamp them, highlights blow out and contrast relationships collapse.

## Intuition

Tone mapping bends a wide dynamic range into a narrower one. Bright values are compressed more aggressively than midtones so the overall scene remains readable instead of exploding into clipped white patches.

## Core idea

- Start from linear HDR-style scene values.
- Optionally apply exposure control to set the overall scene brightness.
- Pass the values through a tone-mapping curve such as Reinhard, filmic, or ACES-style compression.
- Afterward, continue toward output encoding and any late post-processing steps.

## Worked example

A sunlit highlight and a dim shadow can both exist in the same physically-based render. Tone mapping lets the highlight stay intense without erasing every midtone detail in the rest of the image.

## Complexity

Most tone-mapping operators are constant work per pixel. The challenge is choosing a curve that behaves well, not paying for it computationally.

## When to choose it

- Choose tone mapping whenever your scene values exceed the display range.
- Choose histogram equalization when the issue is local or global contrast redistribution in an already bounded image.
- Add bloom later if you want bright regions to glow after the main dynamic-range compression is handled.

## Key takeaways

- Tone mapping compresses dynamic range; it does not replace gamma handling.
- Exposure control and the tone curve work together.
- A good tone mapper preserves scene readability while keeping highlights expressive.
- It is a standard bridge between HDR rendering and LDR output.

## Practice ideas

- Compare clamping against a simple Reinhard or filmic tone mapper on an HDR-like test image.
- Adjust exposure before tone mapping and observe how the same curve behaves differently.
- Add bloom after tone mapping and inspect how highlight glow changes the perceived scene.

## Relation to other topics

- Gamma correction comes later when encoding the final output for display.
- Histogram equalization redistributes contrast differently and is usually not a replacement for HDR compression.
- Bloom is a common companion effect that operates after bright regions have been identified and controlled.
