---
title: "Alpha Compositing"
description: "Combine foreground and background layers with transparency so multiple images or passes can share the same final frame."
date: 2026-03-07
tags: ["graphics", "color", "compositing", "layers"]
draft: false
visualization: "AlphaCompositingVisualization"
family: "color"
kind: "technique"
difficulty: "intro"
prerequisites: ["color-spaces", "gamma-correction"]
related: ["bloom", "tone-mapping", "rasterization"]
enables: ["bloom"]
---

## Problem

Modern graphics pipelines produce layers: UI over a scene, particles over geometry, glow over the base image, decals over surfaces. Those layers need a mathematically consistent way to mix.

## Intuition

The classic over operator says the foreground contributes according to its alpha, and the background contributes whatever weight remains. Compositing is therefore weighted layering, not a naive add or replace.

## Core idea

- For non-premultiplied colors, multiply the foreground color by its alpha before combining.
- Use the over rule so the background only contributes through the uncovered fraction.
- Be explicit about whether the data is premultiplied, because that changes how the formula is applied in code.

## Worked example

A glow pass from bloom is not the whole image. It is a translucent contribution laid over the base render. Alpha compositing is what turns those separate layers into one final picture.

## Complexity

Compositing is constant work per pixel, but it has strong correctness requirements around alpha conventions and color space.

## When to choose it

- Choose it whenever multiple layers or passes need to be merged.
- Do the mixing in an appropriate numeric space rather than blindly in display-encoded values.
- Do not confuse compositing with tone mapping; one combines layers, the other remaps dynamic range.

## Key takeaways

- Alpha compositing is the standard layer-combination primitive.
- Premultiplied and straight alpha are different conventions and must not be mixed carelessly.
- The right color space matters during blending.
- Many post-processing effects end by compositing an auxiliary pass back onto the main image.

## Practice ideas

- Composite a semi-transparent foreground over a checkerboard background.
- Compare straight-alpha and premultiplied-alpha implementations on the same test image.
- Blend a bloom layer back into a tone-mapped base frame.

## Relation to other topics

- Color spaces and gamma correction determine what the pixel values mean during blending.
- Bloom often produces an additive or translucent layer that must be composited into the final image.
- Rasterization generates many of the layers that later get composited together.
