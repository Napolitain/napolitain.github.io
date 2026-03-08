<script lang="ts">
  import { onMount } from 'svelte';

  type DemoMode =
    | 'median-filter'
    | 'bilateral-filter'
    | 'laplacian-log'
    | 'canny-edge-detection'
    | 'connected-components-labeling'
    | 'distance-transform'
    | 'flood-fill'
    | 'skeletonization';

  type SourceKind = 'grayscale' | 'mask' | 'regions';

  interface DemoConfig {
    title: string;
    summary: string;
    sourceKind: SourceKind;
    sourceLabel: string;
    outputLabel: string;
    helper: string;
  }

  const width = 96;
  const height = 96;
  const size = width * height;

  const demoConfigs: Record<DemoMode, DemoConfig> = {
    'median-filter': {
      title: 'Median filter',
      summary: 'Sort each local neighborhood and keep the middle value so isolated outliers disappear without averaging every edge away.',
      sourceKind: 'grayscale',
      sourceLabel: 'Noisy grayscale source',
      outputLabel: 'Median-filtered output',
      helper: 'Increase the kernel radius to remove larger specks, then compare how much structure survives.',
    },
    'bilateral-filter': {
      title: 'Bilateral filter',
      summary: 'Blur nearby pixels while down-weighting neighbors whose intensity is very different from the center.',
      sourceKind: 'grayscale',
      sourceLabel: 'Noisy grayscale source',
      outputLabel: 'Edge-aware smooth output',
      helper: 'Spatial radius spreads the blur, while range sigma decides how willing the filter is to cross an edge.',
    },
    'laplacian-log': {
      title: 'Laplacian / LoG',
      summary: 'Smooth first, then look for rapid second-derivative changes that highlight ridges, blobs, and edge-like structure.',
      sourceKind: 'grayscale',
      sourceLabel: 'Input image',
      outputLabel: 'LoG response magnitude',
      helper: 'The radius controls the smoothing scale before the Laplacian reacts to local curvature.',
    },
    'canny-edge-detection': {
      title: 'Canny edge detection',
      summary: 'Build a more selective edge map by smoothing, taking gradients, suppressing non-maxima, and linking weak edges to strong ones.',
      sourceKind: 'grayscale',
      sourceLabel: 'Input image',
      outputLabel: 'Dual-threshold edge map',
      helper: 'Raise the high threshold for stricter edges, or widen the gap to see hysteresis decide what survives.',
    },
    'connected-components-labeling': {
      title: 'Connected components',
      summary: 'Walk the mask and assign a distinct label to each separately reachable foreground island.',
      sourceKind: 'mask',
      sourceLabel: 'Binary mask',
      outputLabel: 'Region labels',
      helper: 'Switch connectivity to decide whether diagonal touches merge into the same component or stay separate.',
    },
    'distance-transform': {
      title: 'Distance transform',
      summary: 'Start from every source pixel at once and spread outward so each cell knows how far it is from the nearest target set.',
      sourceKind: 'mask',
      sourceLabel: 'Binary mask',
      outputLabel: 'Distance heatmap',
      helper: 'Toggle whether distance should grow away from foreground or away from the background holes.',
    },
    'flood-fill': {
      title: 'Flood fill',
      summary: 'Pick a seed region and expand through neighbors that still belong to the same region class.',
      sourceKind: 'regions',
      sourceLabel: 'Region map',
      outputLabel: 'Filled region',
      helper: 'Click the source image to move the seed and watch how the reachable region changes instantly.',
    },
    'skeletonization': {
      title: 'Skeletonization',
      summary: 'Peel away outer layers of a thick mask while preserving topology so the medial structure remains.',
      sourceKind: 'mask',
      sourceLabel: 'Thick binary shape',
      outputLabel: 'Skeleton',
      helper: 'More passes push the shape closer to a one-pixel-wide centerline, but only while connectivity stays intact.',
    },
  };

  const fourNeighborDirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  const eightNeighborDirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const;

  const labelPalette = [
    [43, 108, 176],
    [236, 72, 153],
    [16, 185, 129],
    [245, 158, 11],
    [99, 102, 241],
    [249, 115, 22],
    [20, 184, 166],
    [168, 85, 247],
  ] as const;

  export let mode: DemoMode;

  let sourceCanvas: HTMLCanvasElement;
  let outputCanvas: HTMLCanvasElement;
  let mounted = false;

  let radius = 2;
  let operationIterations = 1;
  let rangeSigma = 0.18;
  let lowThreshold = 0.16;
  let highThreshold = 0.32;
  let logStrength = 1.6;
  let connectivity: 4 | 8 = 8;
  let distanceTarget: 'foreground' | 'background' = 'foreground';
  let seedX = 24;
  let seedY = 28;
  let skeletonPasses = 12;

  let config: DemoConfig = demoConfigs[mode];

  $: config = demoConfigs[mode];

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function clamp01(value: number): number {
    return clamp(value, 0, 1);
  }

  function indexFor(x: number, y: number): number {
    return y * width + x;
  }

  function sampleClamped(data: ArrayLike<number>, x: number, y: number): number {
    const clampedX = clamp(x, 0, width - 1);
    const clampedY = clamp(y, 0, height - 1);
    return data[indexFor(clampedX, clampedY)];
  }

  function smoothStep(edge0: number, edge1: number, x: number): number {
    const t = clamp01((x - edge0) / Math.max(edge1 - edge0, 1e-6));
    return t * t * (3 - 2 * t);
  }

  function createGrayscaleSource(): Float32Array {
    const data = new Float32Array(size);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = (x - width * 0.5) / width;
        const ny = (y - height * 0.5) / height;
        const distance = Math.hypot(nx, ny);

        const baseGradient = 0.18 + 0.52 * ((x / width) * 0.62 + (y / height) * 0.38);
        const circle = smoothStep(0.22, 0.18, Math.hypot(nx + 0.2, ny + 0.1));
        const square = Math.abs(nx - 0.18) < 0.12 && Math.abs(ny - 0.2) < 0.11 ? 0.72 : 0;
        const stripe = Math.abs(ny + 0.28 - nx * 0.58) < 0.03 ? 0.95 : 0;
        const ringOuter = smoothStep(0.3, 0.26, Math.hypot(nx - 0.18, ny + 0.12));
        const ringInner = smoothStep(0.15, 0.11, Math.hypot(nx - 0.18, ny + 0.12));
        const ring = clamp01(ringOuter - ringInner);
        const deterministicNoise = (((x * 17 + y * 31) % 29) / 28 - 0.5) * 0.16;
        const vignette = clamp01(1 - distance * 1.2);

        data[indexFor(x, y)] = clamp01(
          (baseGradient + circle * 0.58 + square * 0.52 + stripe * 0.4 + ring * 0.36 + deterministicNoise)
            * (0.58 + vignette * 0.42),
        );
      }
    }

    return data;
  }

  function createMaskSource(variant: 'general' | 'skeleton' = 'general'): Uint8Array {
    const data = new Uint8Array(size);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let value = 0;

        if (variant === 'skeleton') {
          const branchX = Math.abs(x - 22) < 5 && y > 10 && y < 82;
          const branchY = Math.abs(y - 30) < 5 && x > 20 && x < 72;
          const diagonal = Math.abs((y - 68) - (x - 26) * 0.52) < 5 && x > 18 && x < 76;
          const loopOuter = Math.hypot(x - 72, y - 68) < 18;
          const loopInner = Math.hypot(x - 72, y - 68) < 9;

          if (branchX || branchY || diagonal || (loopOuter && !loopInner)) {
            value = 1;
          }
        } else {
          const dx1 = x - 26;
          const dy1 = y - 34;
          const dx2 = x - 66;
          const dy2 = y - 62;

          if (dx1 * dx1 + dy1 * dy1 < 18 * 18) {
            value = 1;
          }
          if (x > 52 && x < 86 && y > 18 && y < 42) {
            value = 1;
          }
          if (Math.abs((y - 74) - (x - 14) * 0.44) < 4 && x > 12 && x < 54) {
            value = 1;
          }
          if (dx2 * dx2 + dy2 * dy2 < 10 * 10) {
            value = 0;
          }
          if (x > 64 && x < 69 && y > 24 && y < 38) {
            value = 0;
          }
          if ((x * 19 + y * 11) % 149 === 0) {
            value = 1;
          }
          if ((x * 7 + y * 13) % 181 === 0) {
            value = 0;
          }
        }

        data[indexFor(x, y)] = value;
      }
    }

    return data;
  }

  function createRegionSource(): Uint8Array {
    const data = new Uint8Array(size);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let label = 0;

        if (Math.hypot(x - 24, y - 24) < 18) {
          label = 1;
        }
        if (x > 44 && x < 88 && y > 16 && y < 38) {
          label = 2;
        }
        if (Math.abs((y - 70) - (x - 20) * 0.44) < 8 && x > 14 && x < 58) {
          label = 3;
        }
        if (Math.hypot(x - 70, y - 70) < 16) {
          label = 4;
        }
        if (Math.hypot(x - 70, y - 70) < 7) {
          label = 0;
        }
        if (x > 10 && x < 20 && y > 54 && y < 86) {
          label = 5;
        }

        data[indexFor(x, y)] = label;
      }
    }

    return data;
  }

  function createGaussianKernel(kernelRadius: number, sigma: number): Float32Array {
    const kernelSize = kernelRadius * 2 + 1;
    const kernel = new Float32Array(kernelSize);
    let total = 0;

    for (let offset = -kernelRadius; offset <= kernelRadius; offset += 1) {
      const weight = Math.exp(-(offset * offset) / Math.max(2 * sigma * sigma, 0.0001));
      kernel[offset + kernelRadius] = weight;
      total += weight;
    }

    for (let index = 0; index < kernel.length; index += 1) {
      kernel[index] /= total;
    }

    return kernel;
  }

  function gaussianBlur(data: Float32Array, kernelRadius: number, sigma: number): Float32Array {
    const kernel = createGaussianKernel(kernelRadius, sigma);
    const horizontal = new Float32Array(size);
    const output = new Float32Array(size);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;

        for (let offset = -kernelRadius; offset <= kernelRadius; offset += 1) {
          total += sampleClamped(data, x + offset, y) * kernel[offset + kernelRadius];
        }

        horizontal[indexFor(x, y)] = total;
      }
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;

        for (let offset = -kernelRadius; offset <= kernelRadius; offset += 1) {
          total += sampleClamped(horizontal, x, y + offset) * kernel[offset + kernelRadius];
        }

        output[indexFor(x, y)] = total;
      }
    }

    return output;
  }

  function applyMedianFilter(data: Float32Array, kernelRadius: number): Float32Array {
    const output = new Float32Array(size);
    const windowSide = kernelRadius * 2 + 1;
    const window = new Array<number>(windowSide * windowSide);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let count = 0;

        for (let dy = -kernelRadius; dy <= kernelRadius; dy += 1) {
          for (let dx = -kernelRadius; dx <= kernelRadius; dx += 1) {
            window[count] = sampleClamped(data, x + dx, y + dy);
            count += 1;
          }
        }

        window.slice(0, count).sort((left, right) => left - right);
        output[indexFor(x, y)] = window[Math.floor(count * 0.5)];
      }
    }

    return output;
  }

  function applyBilateralFilter(data: Float32Array, kernelRadius: number, sigmaRange: number): Float32Array {
    const output = new Float32Array(size);
    const sigmaSpatial = Math.max(0.8, kernelRadius * 0.9);
    const spatialDenominator = Math.max(2 * sigmaSpatial * sigmaSpatial, 0.0001);
    const rangeDenominator = Math.max(2 * sigmaRange * sigmaRange, 0.0001);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const center = data[indexFor(x, y)];
        let weightedTotal = 0;
        let totalWeight = 0;

        for (let dy = -kernelRadius; dy <= kernelRadius; dy += 1) {
          for (let dx = -kernelRadius; dx <= kernelRadius; dx += 1) {
            const sample = sampleClamped(data, x + dx, y + dy);
            const spatialWeight = Math.exp(-((dx * dx) + (dy * dy)) / spatialDenominator);
            const difference = sample - center;
            const rangeWeight = Math.exp(-(difference * difference) / rangeDenominator);
            const weight = spatialWeight * rangeWeight;

            weightedTotal += sample * weight;
            totalWeight += weight;
          }
        }

        output[indexFor(x, y)] = weightedTotal / Math.max(totalWeight, 0.0001);
      }
    }

    return output;
  }

  function repeatFloatOperation(
    source: Float32Array,
    iterations: number,
    operation: (current: Float32Array) => Float32Array,
  ): Float32Array {
    let current = source;

    for (let pass = 0; pass < Math.max(1, iterations); pass += 1) {
      current = operation(current);
    }

    return current;
  }

  function laplacianOfGaussian(data: Float32Array, kernelRadius: number, strength: number): Float32Array {
    const blurred = gaussianBlur(data, kernelRadius, Math.max(0.8, kernelRadius * 0.9));
    const output = new Float32Array(size);
    let maxResponse = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const center = sampleClamped(blurred, x, y);
        const response = Math.abs(
          sampleClamped(blurred, x - 1, y)
            + sampleClamped(blurred, x + 1, y)
            + sampleClamped(blurred, x, y - 1)
            + sampleClamped(blurred, x, y + 1)
            - center * 4,
        ) * strength;

        output[indexFor(x, y)] = response;
        maxResponse = Math.max(maxResponse, response);
      }
    }

    const normalized = new Float32Array(size);

    for (let index = 0; index < size; index += 1) {
      normalized[index] = clamp01(output[index] / Math.max(maxResponse, 0.0001));
    }

    return normalized;
  }

  function computeSobel(data: Float32Array): { magnitude: Float32Array; angle: Float32Array } {
    const magnitude = new Float32Array(size);
    const angle = new Float32Array(size);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const gx =
          -sampleClamped(data, x - 1, y - 1)
          + sampleClamped(data, x + 1, y - 1)
          - 2 * sampleClamped(data, x - 1, y)
          + 2 * sampleClamped(data, x + 1, y)
          - sampleClamped(data, x - 1, y + 1)
          + sampleClamped(data, x + 1, y + 1);

        const gy =
          -sampleClamped(data, x - 1, y - 1)
          - 2 * sampleClamped(data, x, y - 1)
          - sampleClamped(data, x + 1, y - 1)
          + sampleClamped(data, x - 1, y + 1)
          + 2 * sampleClamped(data, x, y + 1)
          + sampleClamped(data, x + 1, y + 1);

        const index = indexFor(x, y);
        magnitude[index] = Math.hypot(gx, gy);
        angle[index] = Math.atan2(gy, gx);
      }
    }

    return { magnitude, angle };
  }

  function quantizedDirection(angleValue: number): 0 | 45 | 90 | 135 {
    const degrees = ((angleValue * 180) / Math.PI + 180) % 180;

    if (degrees < 22.5 || degrees >= 157.5) {
      return 0;
    }
    if (degrees < 67.5) {
      return 45;
    }
    if (degrees < 112.5) {
      return 90;
    }
    return 135;
  }

  function applyCanny(data: Float32Array, kernelRadius: number, low: number, high: number): Uint8Array {
    const smoothed = gaussianBlur(data, kernelRadius, Math.max(0.8, kernelRadius * 0.9));
    const { magnitude, angle } = computeSobel(smoothed);
    const suppressed = new Float32Array(size);
    let maxMagnitude = 0;

    for (let index = 0; index < size; index += 1) {
      maxMagnitude = Math.max(maxMagnitude, magnitude[index]);
    }

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = indexFor(x, y);
        const direction = quantizedDirection(angle[index]);
        let sampleA = 0;
        let sampleB = 0;

        if (direction === 0) {
          sampleA = magnitude[indexFor(x - 1, y)];
          sampleB = magnitude[indexFor(x + 1, y)];
        } else if (direction === 45) {
          sampleA = magnitude[indexFor(x - 1, y - 1)];
          sampleB = magnitude[indexFor(x + 1, y + 1)];
        } else if (direction === 90) {
          sampleA = magnitude[indexFor(x, y - 1)];
          sampleB = magnitude[indexFor(x, y + 1)];
        } else {
          sampleA = magnitude[indexFor(x + 1, y - 1)];
          sampleB = magnitude[indexFor(x - 1, y + 1)];
        }

        if (magnitude[index] >= sampleA && magnitude[index] >= sampleB) {
          suppressed[index] = magnitude[index] / Math.max(maxMagnitude, 0.0001);
        }
      }
    }

    const weak = new Uint8Array(size);
    const strong = new Uint8Array(size);

    for (let index = 0; index < size; index += 1) {
      if (suppressed[index] >= high) {
        strong[index] = 1;
      } else if (suppressed[index] >= low) {
        weak[index] = 1;
      }
    }

    const result = new Uint8Array(size);
    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;

    for (let index = 0; index < size; index += 1) {
      if (strong[index]) {
        result[index] = 1;
        queue[tail] = index;
        tail += 1;
      }
    }

    while (head < tail) {
      const current = queue[head];
      head += 1;
      const x = current % width;
      const y = Math.floor(current / width);

      for (const [dx, dy] of eightNeighborDirs) {
        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue;
        }

        const neighborIndex = indexFor(nextX, nextY);
        if (!result[neighborIndex] && weak[neighborIndex]) {
          result[neighborIndex] = 1;
          queue[tail] = neighborIndex;
          tail += 1;
        }
      }
    }

    return result;
  }

  function labelComponents(mask: Uint8Array, selectedConnectivity: 4 | 8): { labels: Int32Array; count: number } {
    const labels = new Int32Array(size);
    labels.fill(-1);

    const dirs = selectedConnectivity === 8 ? eightNeighborDirs : fourNeighborDirs;
    const queue = new Int32Array(size);
    let count = 0;

    for (let index = 0; index < size; index += 1) {
      if (!mask[index] || labels[index] !== -1) {
        continue;
      }

      let head = 0;
      let tail = 0;
      queue[tail] = index;
      tail += 1;
      labels[index] = count;

      while (head < tail) {
        const current = queue[head];
        head += 1;
        const x = current % width;
        const y = Math.floor(current / width);

        for (const [dx, dy] of dirs) {
          const nextX = x + dx;
          const nextY = y + dy;

          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            continue;
          }

          const neighborIndex = indexFor(nextX, nextY);
          if (!mask[neighborIndex] || labels[neighborIndex] !== -1) {
            continue;
          }

          labels[neighborIndex] = count;
          queue[tail] = neighborIndex;
          tail += 1;
        }
      }

      count += 1;
    }

    return { labels, count };
  }

  function distanceTransform(mask: Uint8Array, target: 'foreground' | 'background'): { distances: Int32Array; maxDistance: number } {
    const distances = new Int32Array(size);
    distances.fill(-1);

    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;

    for (let index = 0; index < size; index += 1) {
      const isSource = target === 'foreground' ? mask[index] === 1 : mask[index] === 0;
      if (isSource) {
        distances[index] = 0;
        queue[tail] = index;
        tail += 1;
      }
    }

    let maxDistance = 0;

    while (head < tail) {
      const current = queue[head];
      head += 1;
      const x = current % width;
      const y = Math.floor(current / width);

      for (const [dx, dy] of fourNeighborDirs) {
        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue;
        }

        const neighborIndex = indexFor(nextX, nextY);
        if (distances[neighborIndex] !== -1) {
          continue;
        }

        distances[neighborIndex] = distances[current] + 1;
        maxDistance = Math.max(maxDistance, distances[neighborIndex]);
        queue[tail] = neighborIndex;
        tail += 1;
      }
    }

    return { distances, maxDistance };
  }

  function floodFill(regions: Uint8Array, startX: number, startY: number): Uint8Array {
    const output = new Uint8Array(size);
    const target = regions[indexFor(startX, startY)];
    const queue = new Int32Array(size);
    let head = 0;
    let tail = 0;

    output[indexFor(startX, startY)] = 1;
    queue[tail] = indexFor(startX, startY);
    tail += 1;

    while (head < tail) {
      const current = queue[head];
      head += 1;
      const x = current % width;
      const y = Math.floor(current / width);

      for (const [dx, dy] of fourNeighborDirs) {
        const nextX = x + dx;
        const nextY = y + dy;

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue;
        }

        const neighborIndex = indexFor(nextX, nextY);
        if (output[neighborIndex] || regions[neighborIndex] !== target) {
          continue;
        }

        output[neighborIndex] = 1;
        queue[tail] = neighborIndex;
        tail += 1;
      }
    }

    return output;
  }

  function zhangSuenSkeleton(mask: Uint8Array, maxPasses: number): Uint8Array {
    const current = new Uint8Array(mask);
    const neighbors = new Array<number>(8).fill(0);

    function transitions(values: number[]): number {
      let count = 0;
      for (let index = 0; index < values.length; index += 1) {
        const currentValue = values[index];
        const nextValue = values[(index + 1) % values.length];
        if (currentValue === 0 && nextValue === 1) {
          count += 1;
        }
      }
      return count;
    }

    for (let pass = 0; pass < maxPasses; pass += 1) {
      let changed = false;
      const marked = new Uint8Array(size);

      for (let phase = 0; phase < 2; phase += 1) {
        marked.fill(0);

        for (let y = 1; y < height - 1; y += 1) {
          for (let x = 1; x < width - 1; x += 1) {
            const index = indexFor(x, y);
            if (!current[index]) {
              continue;
            }

            neighbors[0] = current[indexFor(x, y - 1)];
            neighbors[1] = current[indexFor(x + 1, y - 1)];
            neighbors[2] = current[indexFor(x + 1, y)];
            neighbors[3] = current[indexFor(x + 1, y + 1)];
            neighbors[4] = current[indexFor(x, y + 1)];
            neighbors[5] = current[indexFor(x - 1, y + 1)];
            neighbors[6] = current[indexFor(x - 1, y)];
            neighbors[7] = current[indexFor(x - 1, y - 1)];

            const neighborCount = neighbors.reduce((total, value) => total + value, 0);
            const transitionCount = transitions(neighbors);
            const firstConstraint = phase === 0
              ? neighbors[0] * neighbors[2] * neighbors[4] === 0
              : neighbors[0] * neighbors[2] * neighbors[6] === 0;
            const secondConstraint = phase === 0
              ? neighbors[2] * neighbors[4] * neighbors[6] === 0
              : neighbors[0] * neighbors[4] * neighbors[6] === 0;

            if (
              neighborCount >= 2
              && neighborCount <= 6
              && transitionCount === 1
              && firstConstraint
              && secondConstraint
            ) {
              marked[index] = 1;
            }
          }
        }

        for (let index = 0; index < size; index += 1) {
          if (marked[index]) {
            current[index] = 0;
            changed = true;
          }
        }
      }

      if (!changed) {
        break;
      }
    }

    return current;
  }

  function grayscaleToImage(data: Float32Array): ImageData {
    const pixels = new Uint8ClampedArray(size * 4);

    for (let index = 0; index < size; index += 1) {
      const value = Math.round(clamp01(data[index]) * 255);
      const offset = index * 4;
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function binaryToImage(data: Uint8Array): ImageData {
    const pixels = new Uint8ClampedArray(size * 4);

    for (let index = 0; index < size; index += 1) {
      const value = data[index] ? 255 : 12;
      const offset = index * 4;
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function labelsToImage(labels: Int32Array): ImageData {
    const pixels = new Uint8ClampedArray(size * 4);

    for (let index = 0; index < size; index += 1) {
      const label = labels[index];
      const offset = index * 4;

      if (label < 0) {
        pixels[offset] = 18;
        pixels[offset + 1] = 22;
        pixels[offset + 2] = 30;
      } else {
        const color = labelPalette[label % labelPalette.length];
        pixels[offset] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
      }

      pixels[offset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function heatmapColor(t: number): [number, number, number] {
    const clamped = clamp01(t);
    const r = Math.round(255 * clamp01((clamped - 0.1) * 1.2));
    const g = Math.round(255 * clamp01(1 - Math.abs(clamped - 0.52) * 1.8));
    const b = Math.round(255 * clamp01(1.1 - clamped * 1.2));
    return [r, g, b];
  }

  function distancesToImage(distances: Int32Array, maxDistance: number): ImageData {
    const pixels = new Uint8ClampedArray(size * 4);

    for (let index = 0; index < size; index += 1) {
      const normalized = clamp01(distances[index] / Math.max(maxDistance, 1));
      const [r, g, b] = heatmapColor(normalized);
      const offset = index * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function regionsToImage(regions: Uint8Array): ImageData {
    const pixels = new Uint8ClampedArray(size * 4);

    for (let index = 0; index < size; index += 1) {
      const label = regions[index];
      const offset = index * 4;

      if (label === 0) {
        pixels[offset] = 24;
        pixels[offset + 1] = 28;
        pixels[offset + 2] = 34;
      } else {
        const color = labelPalette[(label - 1) % labelPalette.length];
        pixels[offset] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
      }

      pixels[offset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function filledRegionToImage(regions: Uint8Array, filled: Uint8Array, startX: number, startY: number): ImageData {
    const pixels = new Uint8ClampedArray(size * 4);

    for (let index = 0; index < size; index += 1) {
      const label = regions[index];
      const offset = index * 4;
      let baseColor: readonly number[] = [26, 30, 38];

      if (label > 0) {
        baseColor = labelPalette[(label - 1) % labelPalette.length];
      }

      let r = baseColor[0];
      let g = baseColor[1];
      let b = baseColor[2];

      if (filled[index]) {
        r = Math.round(r * 0.35 + 116);
        g = Math.round(g * 0.35 + 218);
        b = Math.round(b * 0.35 + 187);
      }

      const x = index % width;
      const y = Math.floor(index / width);
      if (Math.abs(x - startX) <= 1 && Math.abs(y - startY) <= 1) {
        r = 255;
        g = 255;
        b = 255;
      }

      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function drawCanvas(canvas: HTMLCanvasElement | undefined, image: ImageData) {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.putImageData(image, 0, 0);
  }

  function updateCanvases() {
    if (!mounted || !sourceCanvas || !outputCanvas) {
      return;
    }

    if (mode === 'median-filter') {
      const source = createGrayscaleSource();
      drawCanvas(sourceCanvas, grayscaleToImage(source));
      drawCanvas(
        outputCanvas,
        grayscaleToImage(repeatFloatOperation(source, operationIterations, current => applyMedianFilter(current, radius))),
      );
      return;
    }

    if (mode === 'bilateral-filter') {
      const source = createGrayscaleSource();
      drawCanvas(sourceCanvas, grayscaleToImage(source));
      drawCanvas(
        outputCanvas,
        grayscaleToImage(repeatFloatOperation(source, operationIterations, current => applyBilateralFilter(current, radius, rangeSigma))),
      );
      return;
    }

    if (mode === 'laplacian-log') {
      const source = createGrayscaleSource();
      drawCanvas(sourceCanvas, grayscaleToImage(source));
      drawCanvas(outputCanvas, grayscaleToImage(laplacianOfGaussian(source, radius, logStrength)));
      return;
    }

    if (mode === 'canny-edge-detection') {
      const source = createGrayscaleSource();
      drawCanvas(sourceCanvas, grayscaleToImage(source));
      drawCanvas(outputCanvas, binaryToImage(applyCanny(source, radius, lowThreshold, highThreshold)));
      return;
    }

    if (mode === 'connected-components-labeling') {
      const source = createMaskSource();
      drawCanvas(sourceCanvas, binaryToImage(source));
      drawCanvas(outputCanvas, labelsToImage(labelComponents(source, connectivity).labels));
      return;
    }

    if (mode === 'distance-transform') {
      const source = createMaskSource();
      const { distances, maxDistance } = distanceTransform(source, distanceTarget);
      drawCanvas(sourceCanvas, binaryToImage(source));
      drawCanvas(outputCanvas, distancesToImage(distances, maxDistance));
      return;
    }

    if (mode === 'flood-fill') {
      const regions = createRegionSource();
      const filled = floodFill(regions, seedX, seedY);
      drawCanvas(sourceCanvas, regionsToImage(regions));
      drawCanvas(outputCanvas, filledRegionToImage(regions, filled, seedX, seedY));
      return;
    }

    const source = createMaskSource('skeleton');
    drawCanvas(sourceCanvas, binaryToImage(source));
    drawCanvas(outputCanvas, binaryToImage(zhangSuenSkeleton(source, skeletonPasses)));
  }

  function handleSourceClick(event: MouseEvent) {
    if (mode !== 'flood-fill' || !sourceCanvas) {
      return;
    }

    const rect = sourceCanvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * height);
    seedX = clamp(x, 0, width - 1);
    seedY = clamp(y, 0, height - 1);
  }

  onMount(() => {
    mounted = true;
    updateCanvases();

    return () => {
      mounted = false;
    };
  });

  $: if (mounted) {
    updateCanvases();
  }
</script>

<div class="space-y-6">
  <div class="space-y-2">
    <h3 class="text-base font-semibold text-foreground">{config.title}</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {config.summary}
    </p>
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    <div class="rounded-2xl border border-border bg-background/60 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-foreground">{config.sourceLabel}</p>
        {#if mode === 'flood-fill'}
          <span class="text-xs text-muted-foreground">Click to move the seed</span>
        {/if}
      </div>
      <canvas
        bind:this={sourceCanvas}
        width={width}
        height={height}
        class={`w-full rounded-xl border border-border bg-black/80 object-contain ${mode === 'flood-fill' ? 'cursor-crosshair' : ''}`}
        on:click={handleSourceClick}
      />
    </div>

    <div class="rounded-2xl border border-border bg-background/60 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-foreground">{config.outputLabel}</p>
        <span class="text-xs text-muted-foreground">96 × 96 live preview</span>
      </div>
      <canvas
        bind:this={outputCanvas}
        width={width}
        height={height}
        class="w-full rounded-xl border border-border bg-black/80 object-contain"
      />
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-card/70 p-4">
    <p class="text-sm text-muted-foreground leading-relaxed">
      {config.helper}
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    {#if mode === 'median-filter' || mode === 'bilateral-filter' || mode === 'laplacian-log' || mode === 'canny-edge-detection'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Kernel radius</span>
          <span class="text-xs text-muted-foreground">{radius}</span>
        </div>
        <input bind:value={radius} type="range" min="1" max="3" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'bilateral-filter'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Range sigma</span>
          <span class="text-xs text-muted-foreground">{rangeSigma.toFixed(2)}</span>
        </div>
        <input bind:value={rangeSigma} type="range" min="0.05" max="0.35" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'median-filter' || mode === 'bilateral-filter'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Iterations</span>
          <span class="text-xs text-muted-foreground">{operationIterations}</span>
        </div>
        <input bind:value={operationIterations} type="range" min="1" max="6" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'laplacian-log'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Response strength</span>
          <span class="text-xs text-muted-foreground">{logStrength.toFixed(1)}×</span>
        </div>
        <input bind:value={logStrength} type="range" min="0.8" max="3" step="0.1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'canny-edge-detection'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Low threshold</span>
          <span class="text-xs text-muted-foreground">{lowThreshold.toFixed(2)}</span>
        </div>
        <input bind:value={lowThreshold} type="range" min="0.05" max="0.45" step="0.01" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">High threshold</span>
          <span class="text-xs text-muted-foreground">{highThreshold.toFixed(2)}</span>
        </div>
        <input bind:value={highThreshold} type="range" min="0.12" max="0.7" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'connected-components-labeling'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <span class="text-sm font-medium text-foreground">Connectivity</span>
        <select bind:value={connectivity} class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value={4}>4-neighbor</option>
          <option value={8}>8-neighbor</option>
        </select>
      </label>
    {/if}

    {#if mode === 'distance-transform'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <span class="text-sm font-medium text-foreground">Measure distance to</span>
        <select bind:value={distanceTarget} class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="foreground">Nearest foreground pixel</option>
          <option value="background">Nearest background pixel</option>
        </select>
      </label>
    {/if}

    {#if mode === 'flood-fill'}
      <div class="rounded-2xl border border-border bg-background/60 p-4 space-y-2">
        <p class="text-sm font-medium text-foreground">Seed position</p>
        <p class="text-sm text-muted-foreground">
          ({seedX}, {seedY}) in the low-resolution region map.
        </p>
      </div>
    {/if}

    {#if mode === 'skeletonization'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Thinning passes</span>
          <span class="text-xs text-muted-foreground">{skeletonPasses}</span>
        </div>
        <input bind:value={skeletonPasses} type="range" min="2" max="24" step="1" class="w-full accent-primary" />
      </label>
    {/if}
  </div>
</div>
