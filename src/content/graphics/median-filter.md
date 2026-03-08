---
title: "Median Filter"
description: "Replace each pixel by the median of its neighborhood so salt-and-pepper noise disappears without averaging everything into mush."
date: 2026-03-07
tags: ["graphics", "image-processing", "filter", "noise"]
draft: false
visualization: "MedianFilterVisualization"
family: "filtering"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["image-processing-fundamentals"]
related: ["gaussian-blur", "bilateral-filter", "thresholding"]
enables: ["thresholding", "canny-edge-detection"]
---

## Problem

A weighted blur is great for continuous noise, but it is bad at isolated outliers. One bright dead pixel or one dark speck gets smeared into its neighbors instead of disappearing.

## Intuition

The median filter does not average values. It sorts the neighborhood and keeps the middle one, so single extreme outliers lose their leverage while real local structure survives.

## Core idea

- Pick a neighborhood such as 3 x 3 around the current pixel.
- Collect those intensity values and sort them.
- Write the middle value back to the output pixel.
- On grayscale data that is a direct median. On RGB data you usually filter channels separately or work in a different representation.

## Worked example

If a local patch is mostly around 110 to 120 but one pixel spikes to 255, the median still lands near the cluster of normal values instead of getting pulled upward the way an average would.

## Complexity

For an image with W x H pixels and a k x k neighborhood, a direct implementation costs O(WH k^2 log(k^2)) if you literally sort each window. Small fixed kernels are still practical, and specialized implementations can do better.

## When to choose it

- Choose it when impulse noise or hot pixels dominate.
- Choose something smoother like Gaussian blur when soft denoising matters more than rejecting outliers.
- Choose bilateral filtering when you want smoothing plus stronger edge preservation on continuous images.

## Key takeaways

- Median filtering is a rank filter, not a weighted average.
- It is especially strong against salt-and-pepper style corruption.
- It preserves edges better than a plain blur in many small-kernel settings.
- It is often a better pre-threshold cleanup step than Gaussian blur when the noise is impulsive.

## Practice ideas

- Compare median and Gaussian filtering on the same image with isolated bright specks.
- Run thresholding after each filter and inspect which mask is cleaner.
- Vary the kernel size and watch when thin details start disappearing.

## Relation to other topics

- Gaussian blur smooths by averaging; median filtering smooths by choosing the middle sample.
- Bilateral filtering also tries to preserve edges, but through weighted averaging rather than rank selection.
- Thresholding often benefits from a median pre-pass when the input contains isolated outliers.
