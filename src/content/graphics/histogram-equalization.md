---
title: "Histogram Equalization"
description: "Redistribute grayscale values so a low-contrast image uses more of the available intensity range."
date: 2026-03-07
tags: ["graphics", "image-processing", "histogram", "contrast"]
draft: false
visualization: "HistogramEqualizationVisualization"
family: "color"
kind: "algorithm"
difficulty: "intermediate"
prerequisites: ["image-processing-fundamentals", "color-spaces"]
related: ["tone-mapping", "thresholding", "dithering"]
enables: ["thresholding", "dithering"]
---

## Problem

Some images technically contain detail but waste most of the available intensity range. They look flat because the histogram is cramped into a narrow band.

## Intuition

Histogram equalization stretches value usage by remapping intensities according to the cumulative distribution function. Dense value ranges are spread out so contrast becomes more noticeable.

## Core idea

- Compute the histogram of intensity values.
- Turn it into a cumulative distribution function (CDF).
- Use that CDF as a remapping function from old intensity to new intensity.
- Apply the mapping to every pixel.

## Worked example

If almost every pixel sits between intensity 90 and 130, histogram equalization spreads that narrow band across a much larger display interval, making faint differences more visible.

## Complexity

For a fixed number of bins, the process is O(WH + bins), which is effectively linear in the image size.

## When to choose it

- Choose it when a bounded image is low-contrast and you want to redistribute its values.
- Do not confuse it with tone mapping, which targets HDR-to-display compression rather than histogram spreading in an already bounded image.
- Thresholding often becomes easier after equalization if the foreground and background separate more clearly.

## Key takeaways

- Histogram equalization is contrast redistribution through the CDF.
- It can rescue detail from flat, narrow histograms.
- It may also exaggerate noise or produce harsh-looking results on some images.
- It is often a useful preprocessing step before segmentation or binary output.

## Practice ideas

- Equalize a low-contrast grayscale image and compare its histogram before and after.
- Threshold the original and equalized versions to see whether segmentation improves.
- Compare global equalization to a more local contrast method on the same input.

## Relation to other topics

- Tone mapping is about dynamic range compression, not histogram spreading of an LDR image.
- Thresholding often benefits when foreground and background values separate more clearly after equalization.
- Dithering can help when the equalized result later needs to be represented with a reduced output palette or bit depth.
