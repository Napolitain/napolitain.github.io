---
title: "Temporal Anti-Aliasing (TAA)"
description: "Accumulate information across frames so shimmering and unstable subpixel detail become calmer over time."
date: 2026-03-07
tags: ["graphics", "post-processing", "anti-aliasing", "temporal"]
draft: false
visualization: "TaaVisualization"
family: "post-processing"
kind: "technique"
difficulty: "advanced"
prerequisites: ["z-buffer", "mipmaps", "bloom"]
related: ["ssao", "shadow-mapping"]
enables: []
---

## Problem

A single frame often undersamples thin geometry, high-frequency textures, or noisy full-screen effects. The image looks stable when paused but shimmers badly in motion.

## Intuition

TAA intentionally jitters sampling across frames and accumulates history. Over time, the history approximates a denser sampling pattern than any one frame could provide alone.

## Core idea

- Jitter the camera or sample pattern slightly each frame.
- Render the current frame with that offset.
- Reproject history from previous frames into the current frame’s space.
- Blend current and historical samples while rejecting history that no longer matches well.

## Worked example

A fence or thin wire may flicker from frame to frame under pure single-frame sampling. TAA calms that instability by accumulating information from multiple jittered views over time.

## Complexity

TAA is a full-screen post-process with history buffers, reprojection, and rejection logic. The arithmetic is modest per pixel, but the correctness details are subtle.

## When to choose it

- Choose it when temporal shimmer is one of the most visible quality problems.
- Choose mipmaps first for texture minification aliasing, because TAA works best when the spatial pipeline is already reasonable.
- Pair it carefully with effects like SSAO and bloom that may also carry noise or temporal instability.

## Key takeaways

- TAA uses time as an extra sampling dimension.
- Reprojection and history rejection are just as important as the accumulation itself.
- It can dramatically improve stability, but poor history handling causes ghosting or blur.
- It is one of the major modern tools for real-time image stability.

## Practice ideas

- Accumulate a jittered high-contrast pattern over several frames and compare against the raw current frame.
- Inspect the effect of stronger or weaker history blending on ghosting and stability.
- Compare a scene with mipmaps alone against mipmaps plus TAA.

## Relation to other topics

- Mipmaps solve one major spatial aliasing source before TAA gets involved.
- The z-buffer and motion or reprojection information help align history correctly.
- SSAO and bloom often benefit from temporal stabilization but can also create extra ghosting challenges.
