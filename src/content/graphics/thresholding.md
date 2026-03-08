---
title: "Thresholding"
description: "Convert a grayscale image into a binary mask by splitting values into foreground and background."
date: 2026-03-07
tags: ["graphics", "image-processing", "segmentation", "mask", "webgpu"]
draft: false
visualization: "ThresholdingVisualization"
family: "analysis"
kind: "algorithm"
difficulty: "intro"
prerequisites: ["image-processing-fundamentals"]
related: ["gaussian-blur", "sobel-edge-detection", "opening-closing", "dilation", "erosion"]
enables: ["dilation", "erosion", "opening-closing"]
---

## Problem

Sometimes the real question is not "what exact intensity is this pixel?"

It is:

- foreground or background?
- selected or not selected?
- inside the object or outside it?

Thresholding is the simplest way to turn a continuous image into that binary decision.

## Intuition

Pick a cutoff value $T$.

For each pixel:

- if the value is at least $T$, output foreground
- otherwise, output background

That gives you a binary mask.

This is why thresholding is such a pivotal topic: it moves the pipeline from **continuous image space** into **mask space**.

## The basic algorithm

For a grayscale pixel value `v`:

```text
if v >= T:
    output 1
else:
    output 0
```

That is the entire global-thresholding algorithm.

## Worked example

Suppose the grayscale row is:

```text
30 60 130 180 220
```

With threshold $T = 128$:

```text
0 0 1 1 1
```

Now the output is a mask instead of a smooth signal.

That mask can be passed to:

- dilation
- erosion
- opening
- closing

## Where it succeeds

Thresholding works best when foreground and background are reasonably separable in intensity.

Good fit:

- bright objects on dark backgrounds
- masks for later morphology
- simple segmentation problems

Poor fit:

- heavily varying lighting
- low contrast
- texture-heavy scenes where intensity alone is not enough

## Variants

### Global threshold

One threshold value for the whole image.

### Adaptive threshold

The threshold changes by region, using local context.

The global version is the foundational one, but in real scenes adaptive thresholding is often more robust.

## Complexity

For an image with $W \times H$ pixels:

- thresholding costs $O(WH)$
- memory overhead can be just one output image

It is one of the cheapest useful image-processing operators you can run.

## GPU implementation note

Thresholding is embarrassingly parallel:

- each pixel is independent
- there is no reduction step
- the shader only reads one source pixel and writes one destination pixel

That makes it a great first WebGPU image-processing demo.

## When to choose it

Choose thresholding when:

- the end product should be a mask
- later stages expect binary data
- intensity already carries most of the needed separation

Choose something else when:

- you need smoothing, not binarization
- the goal is edges rather than regions
- the mask already exists and only needs repair

## Key takeaways

- Thresholding converts a continuous image into a **binary mask**
- It is often the bridge between filtering and morphology
- It is cheap, parallel, and easy to implement
- Its weakness is that a bad threshold throws away useful information immediately
- Good thresholding often depends on decent input quality, which is why blur frequently comes first

## Practice ideas

- Apply several threshold values to the same grayscale image and describe how the mask changes
- Blur an image first, then threshold it, and compare with thresholding the noisy original
- Feed a thresholded mask into dilation and erosion to see how binary-mask processing differs from grayscale filtering

## Relation to other topics

- **Gaussian blur** often stabilizes thresholding by reducing noise first
- **Sobel edge detection** answers a different question: where boundaries are, not which region is foreground
- **Dilation** and **erosion** operate naturally on the masks thresholding produces
- **Opening and closing** repair thresholded masks when they are speckled or hole-ridden
