<script lang="ts">
  import { onMount } from 'svelte';

  type DemoMode =
    | 'bilinear-bicubic-interpolation'
    | 'mipmaps'
    | 'color-spaces'
    | 'gamma-correction'
    | 'tone-mapping'
    | 'histogram-equalization'
    | 'dithering'
    | 'alpha-compositing'
    | 'bloom';

  interface DemoConfig {
    title: string;
    summary: string;
    sourceLabel: string;
    outputLabel: string;
    helper: string;
  }

  const canvasWidth = 224;
  const canvasHeight = 160;
  const histogramBins = 16;

  const demoConfigs: Record<DemoMode, DemoConfig> = {
    'bilinear-bicubic-interpolation': {
      title: 'Interpolation sampler',
      summary: 'Magnify a tiny texture with smoother reconstruction so the output no longer jumps between chunky source texels.',
      sourceLabel: 'Base texture',
      outputLabel: 'Magnified compare',
      helper: 'The output canvas compares bilinear on the left and bicubic on the right at the same magnification.',
    },
    mipmaps: {
      title: 'Mipmaps',
      summary: 'Pre-average the texture into lower-resolution levels so minification stops aliasing the full-resolution pattern.',
      sourceLabel: 'High-frequency texture',
      outputLabel: 'Single level vs mip chain',
      helper: 'Both halves shrink the same texture, but only the right half samples a prefiltered mip level.',
    },
    'color-spaces': {
      title: 'Color spaces',
      summary: 'The same endpoints can interpolate very differently depending on whether you reason in RGB channels or hue-based coordinates.',
      sourceLabel: 'Endpoints',
      outputLabel: 'RGB vs HSV interpolation',
      helper: 'The marker tracks one blend position so you can compare how the two spaces travel through color.',
    },
    'gamma-correction': {
      title: 'Gamma correction',
      summary: 'Blending directly in display-encoded values distorts brightness, while linear-light blending keeps the energy relationship saner.',
      sourceLabel: 'Endpoints',
      outputLabel: 'Display blend vs linear blend',
      helper: 'The top band mixes in display space and the bottom band converts through linear light before encoding again.',
    },
    'tone-mapping': {
      title: 'Tone mapping',
      summary: 'Compress HDR-like values into the displayable range so bright highlights remain impressive without clipping every midtone away.',
      sourceLabel: 'Clipped HDR preview',
      outputLabel: 'Tone-mapped output',
      helper: 'Exposure scales the scene before the mapping curve decides how highlights roll off.',
    },
    'histogram-equalization': {
      title: 'Histogram equalization',
      summary: 'Redistribute intensities to use more of the available range when the input lives in a narrow contrast band.',
      sourceLabel: 'Low-contrast source',
      outputLabel: 'Equalized output',
      helper: 'Watch the histogram flatten as the equalized image spends more of the available grayscale range.',
    },
    dithering: {
      title: 'Dithering',
      summary: 'Use spatial structure or error diffusion to fake smooth gradients when the output only supports a small number of intensity levels.',
      sourceLabel: 'Continuous gradient',
      outputLabel: 'Quantized output',
      helper: 'Ordered dithering uses a threshold pattern, while error diffusion pushes quantization mistakes into nearby pixels.',
    },
    'alpha-compositing': {
      title: 'Alpha compositing',
      summary: 'Combine a translucent foreground with a background so layers contribute according to both color and alpha.',
      sourceLabel: 'Background and overlay',
      outputLabel: 'Composited frame',
      helper: 'The overlay stays the same, but the alpha slider changes how much of it survives the over operator.',
    },
    bloom: {
      title: 'Bloom',
      summary: 'Extract the brightest parts of the frame, blur them, and fold the glow back into the main image.',
      sourceLabel: 'Base frame',
      outputLabel: 'Bloom composite',
      helper: 'Raise the threshold for tighter highlights, or increase intensity to make the glow dominate more of the frame.',
    },
  };

  export let mode: DemoMode;

  let sourceCanvas: HTMLCanvasElement;
  let outputCanvas: HTMLCanvasElement;
  let mounted = false;

  let scale = 9;
  let minification = 0.18;
  let blendT = 0.5;
  let gamma = 2.2;
  let exposure = 1.4;
  let toneMethod: 'reinhard' | 'filmic' = 'reinhard';
  let contrastSpan = 0.16;
  let ditherLevels = 4;
  let ditherMethod: 'none' | 'ordered' | 'error-diffusion' = 'ordered';
  let alpha = 0.62;
  let alphaConvention: 'straight' | 'premultiplied' = 'straight';
  let bloomThreshold = 0.68;
  let bloomIntensity = 0.9;

  let config: DemoConfig = demoConfigs[mode];
  let sourceHistogram = Array.from({ length: histogramBins }, () => 0);
  let outputHistogram = Array.from({ length: histogramBins }, () => 0);

  $: config = demoConfigs[mode];

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function clamp01(value: number): number {
    return clamp(value, 0, 1);
  }

  function rgbIndex(width: number, x: number, y: number): number {
    return (y * width + x) * 3;
  }

  function createRgbBuffer(width: number, height: number): Float32Array {
    return new Float32Array(width * height * 3);
  }

  function setPixel(buffer: Float32Array, width: number, x: number, y: number, color: readonly number[]) {
    const index = rgbIndex(width, x, y);
    buffer[index] = color[0];
    buffer[index + 1] = color[1];
    buffer[index + 2] = color[2];
  }

  function getPixel(buffer: Float32Array, width: number, height: number, x: number, y: number): [number, number, number] {
    const clampedX = clamp(x, 0, width - 1);
    const clampedY = clamp(y, 0, height - 1);
    const index = rgbIndex(width, clampedX, clampedY);
    return [buffer[index], buffer[index + 1], buffer[index + 2]];
  }

  function rgbBufferToImageData(buffer: Float32Array, width: number, height: number): ImageData {
    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let index = 0; index < width * height; index += 1) {
      const sourceOffset = index * 3;
      const targetOffset = index * 4;
      pixels[targetOffset] = Math.round(clamp01(buffer[sourceOffset]) * 255);
      pixels[targetOffset + 1] = Math.round(clamp01(buffer[sourceOffset + 1]) * 255);
      pixels[targetOffset + 2] = Math.round(clamp01(buffer[sourceOffset + 2]) * 255);
      pixels[targetOffset + 3] = 255;
    }

    return new ImageData(pixels, width, height);
  }

  function drawBuffer(canvas: HTMLCanvasElement | undefined, buffer: Float32Array, width = canvasWidth, height = canvasHeight) {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.putImageData(rgbBufferToImageData(buffer, width, height), 0, 0);
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function mixColor(left: readonly number[], right: readonly number[], t: number): [number, number, number] {
    return [
      lerp(left[0], right[0], t),
      lerp(left[1], right[1], t),
      lerp(left[2], right[2], t),
    ];
  }

  function srgbToLinear(value: number, selectedGamma = gamma): number {
    return Math.pow(clamp01(value), selectedGamma);
  }

  function linearToSrgb(value: number, selectedGamma = gamma): number {
    return Math.pow(clamp01(value), 1 / selectedGamma);
  }

  function rgbToHsv(color: readonly number[]): [number, number, number] {
    const r = color[0];
    const g = color[1];
    const b = color[2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta > 1e-6) {
      if (max === r) {
        hue = ((g - b) / delta) % 6;
      } else if (max === g) {
        hue = (b - r) / delta + 2;
      } else {
        hue = (r - g) / delta + 4;
      }
      hue /= 6;
      if (hue < 0) {
        hue += 1;
      }
    }

    const saturation = max <= 1e-6 ? 0 : delta / max;
    return [hue, saturation, max];
  }

  function hsvToRgb(color: readonly number[]): [number, number, number] {
    const hue = ((color[0] % 1) + 1) % 1;
    const saturation = clamp01(color[1]);
    const value = clamp01(color[2]);

    const sector = hue * 6;
    const index = Math.floor(sector);
    const fraction = sector - index;
    const p = value * (1 - saturation);
    const q = value * (1 - fraction * saturation);
    const t = value * (1 - (1 - fraction) * saturation);

    switch (index % 6) {
      case 0:
        return [value, t, p];
      case 1:
        return [q, value, p];
      case 2:
        return [p, value, t];
      case 3:
        return [p, q, value];
      case 4:
        return [t, p, value];
      default:
        return [value, p, q];
    }
  }

  function cubicHermite(a: number, b: number, c: number, d: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      b
      + 0.5 * t * (c - a)
      + 0.5 * t2 * (2 * a - 5 * b + 4 * c - d)
      + 0.5 * t3 * (3 * (b - c) + d - a)
    );
  }

  function sampleNearest(buffer: Float32Array, width: number, height: number, u: number, v: number): [number, number, number] {
    const x = Math.round(clamp01(u) * (width - 1));
    const y = Math.round(clamp01(v) * (height - 1));
    return getPixel(buffer, width, height, x, y);
  }

  function sampleBilinear(buffer: Float32Array, width: number, height: number, u: number, v: number): [number, number, number] {
    const sampleX = clamp01(u) * (width - 1);
    const sampleY = clamp01(v) * (height - 1);
    const x0 = Math.floor(sampleX);
    const y0 = Math.floor(sampleY);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = sampleX - x0;
    const ty = sampleY - y0;

    const topLeft = getPixel(buffer, width, height, x0, y0);
    const topRight = getPixel(buffer, width, height, x1, y0);
    const bottomLeft = getPixel(buffer, width, height, x0, y1);
    const bottomRight = getPixel(buffer, width, height, x1, y1);

    return [
      lerp(lerp(topLeft[0], topRight[0], tx), lerp(bottomLeft[0], bottomRight[0], tx), ty),
      lerp(lerp(topLeft[1], topRight[1], tx), lerp(bottomLeft[1], bottomRight[1], tx), ty),
      lerp(lerp(topLeft[2], topRight[2], tx), lerp(bottomLeft[2], bottomRight[2], tx), ty),
    ];
  }

  function sampleBicubic(buffer: Float32Array, width: number, height: number, u: number, v: number): [number, number, number] {
    const sampleX = clamp01(u) * (width - 1);
    const sampleY = clamp01(v) * (height - 1);
    const baseX = Math.floor(sampleX);
    const baseY = Math.floor(sampleY);
    const tx = sampleX - baseX;
    const ty = sampleY - baseY;
    const rows = new Array<[number, number, number]>(4);

    for (let row = -1; row <= 2; row += 1) {
      const samples = new Array<[number, number, number]>(4);
      for (let column = -1; column <= 2; column += 1) {
        samples[column + 1] = getPixel(buffer, width, height, baseX + column, baseY + row);
      }
      rows[row + 1] = [
        cubicHermite(samples[0][0], samples[1][0], samples[2][0], samples[3][0], tx),
        cubicHermite(samples[0][1], samples[1][1], samples[2][1], samples[3][1], tx),
        cubicHermite(samples[0][2], samples[1][2], samples[2][2], samples[3][2], tx),
      ];
    }

    return [
      clamp01(cubicHermite(rows[0][0], rows[1][0], rows[2][0], rows[3][0], ty)),
      clamp01(cubicHermite(rows[0][1], rows[1][1], rows[2][1], rows[3][1], ty)),
      clamp01(cubicHermite(rows[0][2], rows[1][2], rows[2][2], rows[3][2], ty)),
    ];
  }

  function createPixelArtTexture(size = 16): Float32Array {
    const buffer = createRgbBuffer(size, size);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const isChecker = ((Math.floor(x / 2) + Math.floor(y / 2)) % 2) === 0;
        const base = isChecker ? [0.12, 0.18, 0.32] : [0.78, 0.3, 0.26];
        let color: readonly number[] = base;

        if (Math.abs(x - 8) <= 1 && Math.abs(y - 4) <= 1) {
          color = [0.95, 0.94, 0.84];
        } else if (Math.abs(x - 5) <= 1 && Math.abs(y - 10) <= 1) {
          color = [0.25, 0.82, 0.68];
        } else if (Math.abs(x - 11) <= 1 && Math.abs(y - 10) <= 1) {
          color = [0.94, 0.73, 0.23];
        } else if (Math.abs(y - 13) <= 1 && x > 3 && x < 13) {
          color = [0.1, 0.12, 0.18];
        }

        setPixel(buffer, size, x, y, color);
      }
    }

    return buffer;
  }

  function createHighFrequencyTexture(size = 128): Float32Array {
    const buffer = createRgbBuffer(size, size);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const checker = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2) === 0;
        const diagonal = Math.sin((x + y) * 0.35) * 0.5 + 0.5;
        const stripes = Math.sin(x * 0.9) * 0.5 + 0.5;
        const color: [number, number, number] = checker
          ? [0.15 + diagonal * 0.75, 0.18 + stripes * 0.6, 0.28 + diagonal * 0.4]
          : [0.78 - diagonal * 0.5, 0.78 - stripes * 0.42, 0.2 + stripes * 0.32];
        setPixel(buffer, size, x, y, color);
      }
    }

    return buffer;
  }

  function upscaleNearest(source: Float32Array, sourceSize: number): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);
    const contentSize = Math.min(canvasHeight - 24, sourceSize * scale);
    const originX = Math.floor((canvasWidth - contentSize) * 0.5);
    const originY = Math.floor((canvasHeight - contentSize) * 0.5);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        setPixel(output, canvasWidth, x, y, [0.07, 0.08, 0.11]);
      }
    }

    for (let y = 0; y < contentSize; y += 1) {
      for (let x = 0; x < contentSize; x += 1) {
        const u = x / Math.max(contentSize - 1, 1);
        const v = y / Math.max(contentSize - 1, 1);
        const color = sampleNearest(source, sourceSize, sourceSize, u, v);
        setPixel(output, canvasWidth, originX + x, originY + y, color);
      }
    }

    return output;
  }

  function renderInterpolationComparison(source: Float32Array, sourceSize: number): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);
    const leftWidth = Math.floor(canvasWidth * 0.5);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const onLeft = x < leftWidth;
        const localWidth = onLeft ? leftWidth : canvasWidth - leftWidth;
        const localX = onLeft ? x : x - leftWidth;
        const u = clamp01((localX - 16) / Math.max(localWidth - 32, 1));
        const v = clamp01((y - 18) / Math.max(canvasHeight - 36, 1));
        const scaledU = clamp01(0.5 + (u - 0.5) / Math.max(scale / 8, 0.01));
        const scaledV = clamp01(0.5 + (v - 0.5) / Math.max(scale / 8, 0.01));
        const color = onLeft
          ? sampleBilinear(source, sourceSize, sourceSize, scaledU, scaledV)
          : sampleBicubic(source, sourceSize, sourceSize, scaledU, scaledV);
        setPixel(output, canvasWidth, x, y, color);
      }
    }

    return output;
  }

  function buildMipChain(base: Float32Array, baseSize: number): Array<{ size: number; buffer: Float32Array }> {
    const levels = [{ size: baseSize, buffer: base }];
    let currentSize = baseSize;
    let current = base;

    while (currentSize > 1) {
      const nextSize = Math.max(1, Math.floor(currentSize / 2));
      const next = createRgbBuffer(nextSize, nextSize);

      for (let y = 0; y < nextSize; y += 1) {
        for (let x = 0; x < nextSize; x += 1) {
          const sx = x * 2;
          const sy = y * 2;
          const samples = [
            getPixel(current, currentSize, currentSize, sx, sy),
            getPixel(current, currentSize, currentSize, sx + 1, sy),
            getPixel(current, currentSize, currentSize, sx, sy + 1),
            getPixel(current, currentSize, currentSize, sx + 1, sy + 1),
          ];
          setPixel(next, nextSize, x, y, [
            (samples[0][0] + samples[1][0] + samples[2][0] + samples[3][0]) * 0.25,
            (samples[0][1] + samples[1][1] + samples[2][1] + samples[3][1]) * 0.25,
            (samples[0][2] + samples[1][2] + samples[2][2] + samples[3][2]) * 0.25,
          ]);
        }
      }

      levels.push({ size: nextSize, buffer: next });
      current = next;
      currentSize = nextSize;
    }

    return levels;
  }

  function renderMipComparison(base: Float32Array, baseSize: number): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);
    const levels = buildMipChain(base, baseSize);
    const leftWidth = Math.floor(canvasWidth * 0.5);
    const lod = clamp(Math.round((1 - minification) * (levels.length - 1)), 0, levels.length - 1);
    const mipLevel = levels[lod];

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const onLeft = x < leftWidth;
        const localWidth = onLeft ? leftWidth : canvasWidth - leftWidth;
        const localX = onLeft ? x : x - leftWidth;
        const u = clamp01(localX / Math.max(localWidth - 1, 1));
        const v = clamp01(y / Math.max(canvasHeight - 1, 1));
        const repeatedU = (u * (10 * minification + 2)) % 1;
        const repeatedV = (v * (10 * minification + 2)) % 1;
        const color = onLeft
          ? sampleBilinear(base, baseSize, baseSize, repeatedU, repeatedV)
          : sampleBilinear(mipLevel.buffer, mipLevel.size, mipLevel.size, repeatedU, repeatedV);
        setPixel(output, canvasWidth, x, y, color);
      }
    }

    return output;
  }

  function renderColorSpaceSource(left: readonly number[], right: readonly number[]): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const isLeft = x < canvasWidth * 0.5;
        setPixel(output, canvasWidth, x, y, isLeft ? left : right);
      }
    }

    return output;
  }

  function renderColorSpaceCompare(left: readonly number[], right: readonly number[]): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);
    const leftHsv = rgbToHsv(left);
    const rightHsv = rgbToHsv(right);
    let hueDelta = rightHsv[0] - leftHsv[0];

    if (hueDelta > 0.5) {
      hueDelta -= 1;
    } else if (hueDelta < -0.5) {
      hueDelta += 1;
    }

    for (let y = 0; y < canvasHeight; y += 1) {
      const t = y < canvasHeight * 0.5 ? 0 : 1;
      for (let x = 0; x < canvasWidth; x += 1) {
        const u = x / Math.max(canvasWidth - 1, 1);
        const rgbBlend = mixColor(left, right, u);
        const hsvBlend = hsvToRgb([
          leftHsv[0] + hueDelta * u,
          lerp(leftHsv[1], rightHsv[1], u),
          lerp(leftHsv[2], rightHsv[2], u),
        ]);
        const color = t === 0 ? rgbBlend : hsvBlend;

        if (Math.abs(u - blendT) < 0.006) {
          setPixel(output, canvasWidth, x, y, [1, 1, 1]);
        } else {
          setPixel(output, canvasWidth, x, y, color);
        }
      }
    }

    return output;
  }

  function renderGammaCompare(left: readonly number[], right: readonly number[]): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);
    const linearLeft = left.map(channel => srgbToLinear(channel));
    const linearRight = right.map(channel => srgbToLinear(channel));

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const u = x / Math.max(canvasWidth - 1, 1);
        const naive = mixColor(left, right, u);
        const linear = [
          linearToSrgb(lerp(linearLeft[0], linearRight[0], u)),
          linearToSrgb(lerp(linearLeft[1], linearRight[1], u)),
          linearToSrgb(lerp(linearLeft[2], linearRight[2], u)),
        ];

        setPixel(output, canvasWidth, x, y, y < canvasHeight * 0.5 ? naive : linear);
      }
    }

    return output;
  }

  function createHdrScene(): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const nx = (x - canvasWidth * 0.5) / canvasWidth;
        const ny = (y - canvasHeight * 0.5) / canvasHeight;
        const sky = 0.22 + 0.55 * (1 - y / canvasHeight);
        const highlight = Math.exp(-Math.hypot(nx + 0.18, ny + 0.2) * 18) * 5.2;
        const emissive = Math.exp(-Math.hypot(nx - 0.26, ny - 0.1) * 28) * 8.4;
        const strip = Math.abs(ny + 0.12 - nx * 0.55) < 0.04 ? 2.6 : 0;
        const warm = sky + emissive * 1.3 + strip * 0.7;
        const cool = sky * 0.7 + highlight * 0.9;

        setPixel(output, canvasWidth, x, y, [warm, sky + highlight * 0.7, cool]);
      }
    }

    return output;
  }

  function toneMap(buffer: Float32Array): Float32Array {
    const output = new Float32Array(buffer.length);

    for (let index = 0; index < buffer.length; index += 3) {
      for (let channel = 0; channel < 3; channel += 1) {
        const scaled = buffer[index + channel] * exposure;
        const mapped = toneMethod === 'reinhard'
          ? scaled / (1 + scaled)
          : clamp01((scaled * (2.51 * scaled + 0.03)) / (scaled * (2.43 * scaled + 0.59) + 0.14));
        output[index + channel] = mapped;
      }
    }

    return output;
  }

  function createLowContrastScene(): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);
    const low = 0.42 - contrastSpan * 0.5;
    const high = 0.42 + contrastSpan * 0.5;

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const nx = x / canvasWidth;
        const ny = y / canvasHeight;
        const circle = smoothPulse(Math.hypot(nx - 0.36, ny - 0.44), 0.19, 0.16);
        const stripe = Math.abs(ny - 0.72 - nx * 0.2) < 0.035 ? 1 : 0;
        const base = low + (high - low) * clamp01(0.28 + circle * 0.42 + stripe * 0.2 + nx * 0.18 + ny * 0.08);
        setPixel(output, canvasWidth, x, y, [base, base, base]);
      }
    }

    return output;
  }

  function smoothPulse(value: number, outer: number, inner: number): number {
    const outerFalloff = clamp01((outer - value) / Math.max(outer - inner, 1e-6));
    return outerFalloff * outerFalloff * (3 - 2 * outerFalloff);
  }

  function computeHistogram(buffer: Float32Array): number[] {
    const histogram = Array.from({ length: histogramBins }, () => 0);

    for (let index = 0; index < buffer.length; index += 3) {
      const luminance = clamp01(buffer[index]);
      const bucket = Math.min(histogramBins - 1, Math.floor(luminance * histogramBins));
      histogram[bucket] += 1;
    }

    const maxBucket = Math.max(...histogram, 1);
    return histogram.map(value => value / maxBucket);
  }

  function histogramEqualize(buffer: Float32Array): Float32Array {
    const histogram = new Array<number>(256).fill(0);
    const totalPixels = canvasWidth * canvasHeight;

    for (let index = 0; index < buffer.length; index += 3) {
      const value = Math.round(clamp01(buffer[index]) * 255);
      histogram[value] += 1;
    }

    const cdf = new Array<number>(256).fill(0);
    let runningTotal = 0;
    for (let index = 0; index < 256; index += 1) {
      runningTotal += histogram[index];
      cdf[index] = runningTotal / totalPixels;
    }

    const output = new Float32Array(buffer.length);
    for (let index = 0; index < buffer.length; index += 3) {
      const value = Math.round(clamp01(buffer[index]) * 255);
      const mapped = cdf[value];
      output[index] = mapped;
      output[index + 1] = mapped;
      output[index + 2] = mapped;
    }

    return output;
  }

  function createGradientBuffer(): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const gradient = x / Math.max(canvasWidth - 1, 1);
        const contour = smoothPulse(Math.abs(y / canvasHeight - 0.5), 0.22, 0.12);
        const value = clamp01(gradient * 0.8 + contour * 0.2);
        setPixel(output, canvasWidth, x, y, [value, value, value]);
      }
    }

    return output;
  }

  function orderedThreshold(x: number, y: number): number {
    const matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    return (matrix[y % 4][x % 4] + 0.5) / 16;
  }

  function applyDither(buffer: Float32Array): Float32Array {
    const output = new Float32Array(buffer.length);

    if (ditherMethod === 'error-diffusion') {
      const working = new Float32Array(buffer);
      for (let y = 0; y < canvasHeight; y += 1) {
        for (let x = 0; x < canvasWidth; x += 1) {
          const index = rgbIndex(canvasWidth, x, y);
          const value = clamp01(working[index]);
          const quantized = Math.round(value * (ditherLevels - 1)) / Math.max(ditherLevels - 1, 1);
          const error = value - quantized;

          output[index] = quantized;
          output[index + 1] = quantized;
          output[index + 2] = quantized;

          const diffusionTargets: Array<[number, number, number]> = [
            [1, 0, 7 / 16],
            [-1, 1, 3 / 16],
            [0, 1, 5 / 16],
            [1, 1, 1 / 16],
          ];

          for (const [dx, dy, weight] of diffusionTargets) {
            const nextX = x + dx;
            const nextY = y + dy;
            if (nextX < 0 || nextX >= canvasWidth || nextY < 0 || nextY >= canvasHeight) {
              continue;
            }
            const nextIndex = rgbIndex(canvasWidth, nextX, nextY);
            working[nextIndex] = clamp01(working[nextIndex] + error * weight);
            working[nextIndex + 1] = working[nextIndex];
            working[nextIndex + 2] = working[nextIndex];
          }
        }
      }

      return output;
    }

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const index = rgbIndex(canvasWidth, x, y);
        const value = clamp01(buffer[index]);
        const threshold = ditherMethod === 'ordered' ? orderedThreshold(x, y) - 0.5 : 0;
        const adjusted = clamp01(value + threshold / Math.max(ditherLevels, 2));
        const quantized = Math.round(adjusted * (ditherLevels - 1)) / Math.max(ditherLevels - 1, 1);

        output[index] = quantized;
        output[index + 1] = quantized;
        output[index + 2] = quantized;
      }
    }

    return output;
  }

  function createCompositeSource(): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const checker = ((Math.floor(x / 12) + Math.floor(y / 12)) % 2) === 0;
        const background = checker ? [0.18, 0.2, 0.26] : [0.82, 0.86, 0.92];
        const overlayCenterX = canvasWidth * 0.54;
        const overlayCenterY = canvasHeight * 0.44;
        const distance = Math.hypot(x - overlayCenterX, y - overlayCenterY);
        const overlayMask = clamp01(1 - distance / 62);
        const overlayColor = [0.96, 0.48, 0.22];

        const backgroundPreview = x < canvasWidth * 0.5 ? background : [overlayColor[0] * overlayMask, overlayColor[1] * overlayMask, overlayColor[2] * overlayMask];
        setPixel(output, canvasWidth, x, y, backgroundPreview);
      }
    }

    return output;
  }

  function compositeOver(): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const checker = ((Math.floor(x / 12) + Math.floor(y / 12)) % 2) === 0;
        const background = checker ? [0.18, 0.2, 0.26] : [0.82, 0.86, 0.92];
        const overlayCenterX = canvasWidth * 0.54;
        const overlayCenterY = canvasHeight * 0.44;
        const distance = Math.hypot(x - overlayCenterX, y - overlayCenterY);
        const radial = clamp01(1 - distance / 62);
        const overlayAlpha = radial * alpha;
        const overlayColor = alphaConvention === 'premultiplied'
          ? [0.96 * overlayAlpha, 0.48 * overlayAlpha, 0.22 * overlayAlpha]
          : [0.96, 0.48, 0.22];

        const color = alphaConvention === 'premultiplied'
          ? [
            overlayColor[0] + background[0] * (1 - overlayAlpha),
            overlayColor[1] + background[1] * (1 - overlayAlpha),
            overlayColor[2] + background[2] * (1 - overlayAlpha),
          ]
          : [
            overlayColor[0] * overlayAlpha + background[0] * (1 - overlayAlpha),
            overlayColor[1] * overlayAlpha + background[1] * (1 - overlayAlpha),
            overlayColor[2] * overlayAlpha + background[2] * (1 - overlayAlpha),
          ];

        setPixel(output, canvasWidth, x, y, color);
      }
    }

    return output;
  }

  function blurRgb(buffer: Float32Array, radius: number): Float32Array {
    const output = new Float32Array(buffer.length);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const sums = [0, 0, 0];
        let totalWeight = 0;

        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const distanceSquared = dx * dx + dy * dy;
            const weight = Math.exp(-distanceSquared / Math.max(radius * radius * 0.9, 0.0001));
            const sample = getPixel(buffer, canvasWidth, canvasHeight, x + dx, y + dy);
            sums[0] += sample[0] * weight;
            sums[1] += sample[1] * weight;
            sums[2] += sample[2] * weight;
            totalWeight += weight;
          }
        }

        setPixel(output, canvasWidth, x, y, [
          sums[0] / totalWeight,
          sums[1] / totalWeight,
          sums[2] / totalWeight,
        ]);
      }
    }

    return output;
  }

  function createBloomSource(): Float32Array {
    const output = createRgbBuffer(canvasWidth, canvasHeight);

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const nx = x / canvasWidth;
        const ny = y / canvasHeight;
        const base = 0.05 + 0.25 * (1 - ny);
        const orb = Math.exp(-Math.hypot(nx - 0.28, ny - 0.44) * 16) * 1.8;
        const sign = Math.abs(ny - 0.74 - nx * 0.18) < 0.035 ? 1.6 : 0;
        const hot = Math.exp(-Math.hypot(nx - 0.7, ny - 0.26) * 30) * 2.8;

        setPixel(output, canvasWidth, x, y, [base + hot * 1.2, base + orb * 0.55 + sign * 0.35, base + orb * 1.1]);
      }
    }

    return output;
  }

  function applyBloom(source: Float32Array): Float32Array {
    const brightPass = new Float32Array(source.length);

    for (let index = 0; index < source.length; index += 3) {
      const luminance = source[index] * 0.2126 + source[index + 1] * 0.7152 + source[index + 2] * 0.0722;
      const keep = luminance >= bloomThreshold ? 1 : 0;
      brightPass[index] = source[index] * keep;
      brightPass[index + 1] = source[index + 1] * keep;
      brightPass[index + 2] = source[index + 2] * keep;
    }

    const blurred = blurRgb(brightPass, 4);
    const output = new Float32Array(source.length);

    for (let index = 0; index < source.length; index += 3) {
      output[index] = clamp01(source[index] + blurred[index] * bloomIntensity * 0.35);
      output[index + 1] = clamp01(source[index + 1] + blurred[index + 1] * bloomIntensity * 0.35);
      output[index + 2] = clamp01(source[index + 2] + blurred[index + 2] * bloomIntensity * 0.35);
    }

    return output;
  }

  function updateCanvases() {
    if (!mounted || !sourceCanvas || !outputCanvas) {
      return;
    }

    if (mode === 'bilinear-bicubic-interpolation') {
      const source = createPixelArtTexture();
      drawBuffer(sourceCanvas, upscaleNearest(source, 16));
      drawBuffer(outputCanvas, renderInterpolationComparison(source, 16));
      return;
    }

    if (mode === 'mipmaps') {
      const source = createHighFrequencyTexture();
      drawBuffer(sourceCanvas, renderMipComparison(source, 128));
      drawBuffer(outputCanvas, renderMipComparison(source, 128));
      return;
    }

    if (mode === 'color-spaces') {
      const left = [0.92, 0.32, 0.28] as const;
      const right = [0.15, 0.62, 0.94] as const;
      drawBuffer(sourceCanvas, renderColorSpaceSource(left, right));
      drawBuffer(outputCanvas, renderColorSpaceCompare(left, right));
      return;
    }

    if (mode === 'gamma-correction') {
      const left = [0.12, 0.22, 0.86] as const;
      const right = [0.96, 0.64, 0.18] as const;
      drawBuffer(sourceCanvas, renderColorSpaceSource(left, right));
      drawBuffer(outputCanvas, renderGammaCompare(left, right));
      return;
    }

    if (mode === 'tone-mapping') {
      const hdr = createHdrScene();
      const clipped = new Float32Array(hdr.length);
      for (let index = 0; index < hdr.length; index += 1) {
        clipped[index] = clamp01(hdr[index]);
      }
      drawBuffer(sourceCanvas, clipped);
      drawBuffer(outputCanvas, toneMap(hdr));
      return;
    }

    if (mode === 'histogram-equalization') {
      const source = createLowContrastScene();
      const equalized = histogramEqualize(source);
      sourceHistogram = computeHistogram(source);
      outputHistogram = computeHistogram(equalized);
      drawBuffer(sourceCanvas, source);
      drawBuffer(outputCanvas, equalized);
      return;
    }

    if (mode === 'dithering') {
      const source = createGradientBuffer();
      drawBuffer(sourceCanvas, source);
      drawBuffer(outputCanvas, applyDither(source));
      return;
    }

    if (mode === 'alpha-compositing') {
      drawBuffer(sourceCanvas, createCompositeSource());
      drawBuffer(outputCanvas, compositeOver());
      return;
    }

    const source = createBloomSource();
    drawBuffer(sourceCanvas, source);
    drawBuffer(outputCanvas, applyBloom(source));
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
        <span class="text-xs text-muted-foreground">Reference view</span>
      </div>
      <canvas bind:this={sourceCanvas} width={canvasWidth} height={canvasHeight} class="w-full rounded-xl border border-border bg-black/80 object-contain" />
    </div>

    <div class="rounded-2xl border border-border bg-background/60 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-foreground">{config.outputLabel}</p>
        <span class="text-xs text-muted-foreground">Interactive compare</span>
      </div>
      <canvas bind:this={outputCanvas} width={canvasWidth} height={canvasHeight} class="w-full rounded-xl border border-border bg-black/80 object-contain" />
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-card/70 p-4">
    <p class="text-sm text-muted-foreground leading-relaxed">
      {config.helper}
    </p>
  </div>

  {#if mode === 'histogram-equalization'}
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <p class="text-sm font-medium text-foreground">Source histogram</p>
        <div class="flex h-24 items-end gap-1">
          {#each sourceHistogram as value}
            <div class="flex-1 rounded-t bg-primary/55" style={`height: ${Math.max(value * 100, 6)}%`} />
          {/each}
        </div>
      </div>
      <div class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <p class="text-sm font-medium text-foreground">Equalized histogram</p>
        <div class="flex h-24 items-end gap-1">
          {#each outputHistogram as value}
            <div class="flex-1 rounded-t bg-emerald-500/60" style={`height: ${Math.max(value * 100, 6)}%`} />
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="grid gap-4 md:grid-cols-2">
    {#if mode === 'bilinear-bicubic-interpolation'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Magnification</span>
          <span class="text-xs text-muted-foreground">{scale.toFixed(0)}×</span>
        </div>
        <input bind:value={scale} type="range" min="4" max="14" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'mipmaps'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Minification</span>
          <span class="text-xs text-muted-foreground">{minification.toFixed(2)}</span>
        </div>
        <input bind:value={minification} type="range" min="0.08" max="0.35" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'color-spaces'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Blend marker</span>
          <span class="text-xs text-muted-foreground">{blendT.toFixed(2)}</span>
        </div>
        <input bind:value={blendT} type="range" min="0" max="1" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'gamma-correction'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Display gamma</span>
          <span class="text-xs text-muted-foreground">{gamma.toFixed(1)}</span>
        </div>
        <input bind:value={gamma} type="range" min="1.6" max="2.6" step="0.1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'tone-mapping'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Exposure</span>
          <span class="text-xs text-muted-foreground">{exposure.toFixed(1)}×</span>
        </div>
        <input bind:value={exposure} type="range" min="0.4" max="2.4" step="0.1" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <span class="text-sm font-medium text-foreground">Curve</span>
        <select bind:value={toneMethod} class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="reinhard">Reinhard</option>
          <option value="filmic">Filmic / ACES-style</option>
        </select>
      </label>
    {/if}

    {#if mode === 'histogram-equalization'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Input contrast span</span>
          <span class="text-xs text-muted-foreground">{contrastSpan.toFixed(2)}</span>
        </div>
        <input bind:value={contrastSpan} type="range" min="0.08" max="0.32" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'dithering'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Quantization levels</span>
          <span class="text-xs text-muted-foreground">{ditherLevels}</span>
        </div>
        <input bind:value={ditherLevels} type="range" min="2" max="8" step="1" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <span class="text-sm font-medium text-foreground">Dither method</span>
        <select bind:value={ditherMethod} class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="none">No dithering</option>
          <option value="ordered">Ordered (Bayer)</option>
          <option value="error-diffusion">Error diffusion</option>
        </select>
      </label>
    {/if}

    {#if mode === 'alpha-compositing'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Foreground alpha</span>
          <span class="text-xs text-muted-foreground">{alpha.toFixed(2)}</span>
        </div>
        <input bind:value={alpha} type="range" min="0.1" max="1" step="0.01" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <span class="text-sm font-medium text-foreground">Alpha convention</span>
        <select bind:value={alphaConvention} class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="straight">Straight alpha</option>
          <option value="premultiplied">Premultiplied alpha</option>
        </select>
      </label>
    {/if}

    {#if mode === 'bloom'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Bright-pass threshold</span>
          <span class="text-xs text-muted-foreground">{bloomThreshold.toFixed(2)}</span>
        </div>
        <input bind:value={bloomThreshold} type="range" min="0.3" max="1.1" step="0.01" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Glow intensity</span>
          <span class="text-xs text-muted-foreground">{bloomIntensity.toFixed(1)}×</span>
        </div>
        <input bind:value={bloomIntensity} type="range" min="0.2" max="1.8" step="0.1" class="w-full accent-primary" />
      </label>
    {/if}
  </div>
</div>
