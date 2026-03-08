---
title: "Color Spaces"
description: "Choose the right representation for the job, because RGB, HSV, linear light, and display-encoded values make different operations easy or safe."
date: 2026-03-07
tags: ["graphics", "color", "representation", "lighting"]
draft: false
visualization: "ColorSpacesVisualization"
family: "color"
kind: "concept"
difficulty: "intro"
prerequisites: ["image-processing-fundamentals"]
related: ["gamma-correction", "tone-mapping", "alpha-compositing"]
enables: ["gamma-correction", "tone-mapping", "alpha-compositing"]
---

## Problem

A color value is not just three arbitrary numbers. The meaning of those numbers changes depending on the color space, and some operations become misleading or outright wrong in the wrong representation.

## Intuition

RGB is convenient for display and storage, but not always for reasoning. HSV or HSL makes hue and saturation easier to manipulate. Linear-light RGB is what you want for many physical light computations and blends. Display-encoded RGB is what your monitor expects.

## Core idea

- Treat color space as part of the data, not an afterthought.
- Convert into a representation that makes the operation meaningful or safe.
- Do the manipulation there, then convert back if needed for storage or display.

## Worked example

Adjusting brightness in display-encoded RGB is not the same as adjusting it in linear light. Likewise, rotating hue is much more natural in HSV-style coordinates than in raw RGB components.

## Complexity

Color-space conversion is constant work per pixel, but the correctness impact is much larger than the arithmetic cost suggests.

## When to choose it

- Choose linear-light spaces for physically meaningful blends and many lighting computations.
- Choose HSV or HSL when user-facing hue and saturation controls matter.
- Choose the display space only at output time when encoding for the screen.

## Key takeaways

- Color values only make sense together with their space.
- Representation changes what operations are intuitive and what operations are correct.
- Gamma correction and tone mapping both depend on understanding the numeric meaning of the input and output spaces.
- A surprising number of rendering bugs are really color-space bugs.

## Practice ideas

- Implement a hue slider in HSV and compare it to naive channel edits in RGB.
- Blend two colors in linear light and in display space, then compare the results.
- Trace where your pipeline changes color spaces and where it should.

## Relation to other topics

- Gamma correction is fundamentally about moving between linear-light reasoning and display encoding.
- Tone mapping usually compresses HDR-style linear values before output encoding.
- Alpha compositing should respect the numeric meaning of the colors being mixed.
