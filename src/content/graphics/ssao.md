---
title: "Screen-Space Ambient Occlusion (SSAO)"
description: "Approximate local ambient shadowing from the depth and normal buffers so creases and contact areas feel less flat."
date: 2026-03-07
tags: ["graphics", "lighting", "ambient-occlusion", "screen-space"]
draft: false
visualization: "SsaoVisualization"
family: "lighting"
kind: "technique"
difficulty: "advanced"
prerequisites: ["z-buffer", "shadow-mapping"]
related: ["bloom", "taa"]
enables: ["taa"]
---

## Problem

Even with direct lighting, scenes can feel flat because corners, cracks, and contact regions miss the subtle darkening that real indirect occlusion would create.

## Intuition

SSAO samples the nearby depth or geometry configuration around each visible pixel and estimates how blocked the hemisphere is. More nearby blockers imply less ambient light should reach that pixel.

## Core idea

- Start from a depth buffer and often a normal buffer.
- Sample nearby points around each pixel in screen space.
- Estimate how much surrounding geometry occludes the local hemisphere.
- Darken the pixel proportionally and usually blur or stabilize the result afterward.

## Worked example

A box sitting on a floor looks less floaty once the contact region darkens slightly. SSAO produces that contact shadow feel even without tracing true global illumination.

## Complexity

The effect cost depends on sample count, blur passes, and resolution. It is still usually much cheaper than full physically based global illumination.

## When to choose it

- Choose it when you want cheap local ambient depth cues.
- Choose shadow mapping when you need directional visibility from a particular light source.
- Use TAA or similar stabilization when the raw SSAO result flickers under motion.

## Key takeaways

- SSAO is an approximation based on already visible geometry in screen space.
- It enhances contact and crevice shading rather than replacing real shadowing.
- Noise, blur, and temporal stabilization are common practical concerns.
- It reuses depth information for lighting rather than primary visibility.

## Practice ideas

- Visualize the occlusion buffer separately from the lit frame.
- Compare low-sample and high-sample SSAO and inspect the noise difference.
- Apply temporal stabilization or blur and note which artifacts remain.

## Relation to other topics

- The z-buffer supplies the geometric depth structure SSAO relies on.
- Shadow mapping answers light visibility from a source; SSAO approximates ambient occlusion from nearby screen-space geometry.
- TAA often appears later to stabilize noisy full-screen effects such as SSAO.
