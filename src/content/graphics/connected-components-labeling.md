---
title: "Connected-Components Labeling"
description: "Turn a binary mask into object IDs so you can count, measure, filter, and track separate regions instead of raw foreground pixels."
date: 2026-03-07
tags: ["graphics", "image-processing", "segmentation", "components"]
draft: false
visualization: "ConnectedComponentsVisualization"
family: "analysis"
kind: "technique"
difficulty: "intermediate"
prerequisites: ["thresholding", "flood-fill"]
related: ["distance-transform", "skeletonization", "opening-closing"]
enables: ["distance-transform", "skeletonization"]
---

## Problem

A binary mask says which pixels are foreground, but it does not yet say how many distinct objects exist or which foreground pixels belong together.

## Intuition

Connected-components labeling groups foreground pixels by connectivity. Once every region gets an ID, you can count objects, compute areas, extract bounding boxes, or ignore tiny fragments.

## Core idea

- Define connectivity, usually 4-neighbor or 8-neighbor.
- Traverse every unvisited foreground pixel with BFS, DFS, or a two-pass union-find style algorithm.
- Assign one label to all pixels reached in that traversal.
- Repeat until every foreground region has a label.

## Worked example

If a thresholded image contains three disconnected bright blobs, component labeling converts one foreground mask into three object IDs, which is exactly what later measurement code needs.

## Complexity

A straightforward traversal-based implementation is O(WH) because every pixel is visited a constant number of times.

## When to choose it

- Choose it when object counting, measurement, or per-region filtering matters.
- Choose flood fill when you only care about one seeded region rather than every object in the image.
- Choose distance transform when geometry relative to boundaries matters more than region IDs.

## Key takeaways

- Connected-components labeling upgrades a mask into object-level structure.
- The key design choice is the connectivity rule: 4-neighbor and 8-neighbor can disagree.
- It is linear-time and often one of the first post-threshold analysis steps.
- Many later shape tools assume labeled regions rather than unlabeled masks.

## Practice ideas

- Threshold an image, then remove every connected component smaller than a chosen area.
- Compare 4-connectivity and 8-connectivity on a diagonally touching pattern.
- Compute a bounding box and area for each labeled component.

## Relation to other topics

- Flood fill grows one chosen region; component labeling partitions all regions.
- Opening and closing often clean the mask before labeling so tiny junk components disappear.
- Distance transform and skeletonization often operate on regions that have already been isolated or filtered.
