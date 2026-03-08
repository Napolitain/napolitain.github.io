---
title: "Image Processing Fundamentals"
description: "Build the mental model behind blur, thresholding, edges, and morphology: pixels, neighborhoods, kernels, masks, and why local operators compose into pipelines."
date: 2026-03-07
tags: ["graphics", "image-processing", "pixels", "kernels", "masks"]
draft: false
family: "foundations"
kind: "concept"
difficulty: "intro"
prerequisites: []
related: ["gaussian-blur", "thresholding", "sobel-edge-detection", "dilation", "erosion", "opening-closing"]
enables: ["gaussian-blur", "thresholding", "sobel-edge-detection", "dilation", "erosion", "opening-closing"]
---

## Problem

A lot of graphics work is really the same question in different clothes:

- smooth noisy data
- detect where something changes sharply
- turn an image into a mask
- repair that mask so it becomes usable

If you do not have a clear mental model for **pixels**, **neighborhoods**, and **binary masks**, these operations look like unrelated tricks. They are not. They are all local operators over image data.

## Intuition

Think of an image as a grid of values.

- In a grayscale image, each pixel is a number like 0 to 255.
- In an RGB image, each pixel is a small vector of values.
- In a binary mask, each pixel is effectively either 0 or 1.

Most foundational image-processing algorithms do one simple thing:

> For each pixel, look at a neighborhood around it and compute a new value.

That single sentence covers blur, edge detection, dilation, erosion, opening, and closing.

## Continuous images vs binary masks

This split is the first thing to identify before choosing an operator.

### Continuous image

The value matters smoothly. Nearby intensities should stay nearby.

Use operators like:

- Gaussian blur
- edge filters such as Sobel
- sharpening
- convolution-based filters in general

### Binary mask

The image now answers a yes/no question:

- foreground vs background
- object vs not object
- selected vs not selected

Once you are in mask space, morphology becomes available:

- dilation grows the foreground
- erosion shrinks it
- opening removes small bright noise
- closing fills small dark gaps

That is why **thresholding is a bridge topic**. It converts a continuous image into a binary mask that morphology can operate on.

## Neighborhoods, kernels, and structuring elements

### Kernel

A kernel is a small matrix that tells you how to combine neighboring pixels.

Example:

```text
1 2 1
2 4 2
1 2 1
```

That kind of weighted neighborhood is what convolution-based filters use.

### Structuring element

Morphology uses a similar local window, but conceptually it asks a different question:

- does **any** neighbor contain foreground?
- do **all** neighbors contain foreground?

That neighborhood is often called a **structuring element**.

So convolution and morphology both inspect local windows, but:

- convolution usually computes weighted sums
- morphology usually computes local max/min style decisions on masks

## The four common stages

Many practical pipelines look like this:

1. **Smooth** the image so tiny fluctuations stop dominating.
2. **Analyze** the image to extract structure, such as edges or a mask.
3. **Clean** the mask with morphology.
4. **Use** the result in later rendering, measurement, tracking, or selection.

One concrete example:

1. Gaussian blur removes noise.
2. Thresholding turns grayscale into foreground/background.
3. Opening removes isolated bright specks.
4. Closing seals tiny holes in the kept region.

The important point is that the operators are not isolated. They enable one another.

## Why local operators fit GPUs so well

A fragment or compute shader is naturally good at:

- reading a pixel
- reading a small local neighborhood
- writing one output pixel

That is exactly what these operators need.

For an image with $W \times H$ pixels and a neighborhood of size $k \times k$:

- the image has $O(WH)$ pixels
- each output pixel inspects $O(k^2)$ neighbors
- a direct implementation costs $O(WHk^2)$

This is why GPU acceleration matters: the work is massively parallel across pixels.

## Common failure mode

The wrong operator often answers the wrong question.

- Blur is not mask repair.
- Thresholding is not edge detection.
- Dilation is not the same as closing.
- Opening and closing are not interchangeable.

The fastest way to improve your graphics intuition is to ask:

> Is this still a continuous image problem, or has it become a binary-mask problem?

That one question eliminates many wrong tool choices.

## Key takeaways

- Most introductory graphics operators are **local neighborhood transforms**
- The first major split is **continuous image** vs **binary mask**
- **Thresholding** often bridges those worlds
- **Convolution filters** and **morphology operators** both inspect local windows, but they compute different kinds of outputs
- Graphics pipelines feel simpler once you see how one operator enables the next

## Practice ideas

- Implement a 3 x 3 blur, threshold, dilation, and erosion on the same tiny image and compare the outputs
- Start from a noisy grayscale test image, then build a full blur -> threshold -> opening pipeline
- Replace one step in a working pipeline with the wrong operator and explain exactly why the result gets worse

## Relation to other topics

- **Gaussian blur** is the standard continuous-image smoothing operator
- **Thresholding** converts tone into a binary mask
- **Sobel edge detection** extracts boundary strength rather than region membership
- **Dilation** and **erosion** are the two primitive morphology operators
- **Opening and closing** compose dilation and erosion into more targeted mask-repair tools
