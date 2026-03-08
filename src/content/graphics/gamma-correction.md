---
title: "Gamma Correction"
description: "Match linear-light math to display-encoded output so blends, shading, and gradients do not look mysteriously wrong."
date: 2026-03-07
tags: ["graphics", "color", "gamma", "display"]
draft: false
visualization: "GammaCorrectionVisualization"
family: "color"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["color-spaces"]
related: ["tone-mapping", "alpha-compositing", "dithering"]
enables: ["tone-mapping", "alpha-compositing"]
---

## Problem

Monitors and images are usually not linear-light devices or encodings, but most graphics math assumes linearity. If you ignore that mismatch, gradients, blends, and lighting look off for reasons that are annoyingly non-obvious.

## Intuition

Gamma correction is the bridge between the space where light computations should happen and the space the display expects. Decode into linear space, do the math there, then encode back for output.

## Core idea

- Interpret display-encoded colors as non-linear values.
- Convert them into a linear-light representation before blending or lighting operations.
- After processing, re-encode for the display or target image format.

## Worked example

A midpoint between black and white in display space often looks too dark when used as a physical average. The same midpoint computed in linear light and then encoded back looks more perceptually and physically plausible.

## Complexity

Gamma encode and decode are constant work per pixel. The cost is tiny; the visual impact is huge.

## When to choose it

- Choose gamma-aware processing whenever you blend or light colors that eventually go to a display.
- Do not confuse gamma correction with tone mapping; one handles encoding, the other handles dynamic range compression.
- Dithering and final output stages often come after gamma-aware processing, not before it.

## Key takeaways

- Gamma correction is about numeric meaning, not an artistic effect.
- Blend and shade in linear light when possible.
- Encode for the display only at the appropriate output boundary.
- Many washed-out or too-dark pipelines are really gamma mistakes.

## Practice ideas

- Blend the same two colors in gamma space and in linear space.
- Compare a grayscale ramp before and after explicit gamma handling.
- Audit a shader pipeline and mark exactly where colors become linear or encoded.

## Relation to other topics

- Color spaces supply the broader context for why gamma even exists.
- Tone mapping usually happens before the final gamma-style output encoding.
- Alpha compositing should respect the space in which the blend is being performed.
