<script lang="ts">
  import { onMount } from 'svelte';

  type DemoMode =
    | 'gaussian-blur'
    | 'thresholding'
    | 'dilation'
    | 'erosion'
    | 'opening-closing'
    | 'sobel-edge-detection';

  interface DemoConfig {
    title: string;
    summary: string;
    sourceKind: 'grayscale' | 'mask';
    outputLabel: string;
  }

  const width = 256;
  const height = 256;
  const maxKernelRadius = 6;

  const demoConfigs: Record<DemoMode, DemoConfig> = {
    'gaussian-blur': {
      title: 'Gaussian blur',
      summary: 'Smooth the image with a weighted neighborhood so local noise fades before later stages.',
      sourceKind: 'grayscale',
      outputLabel: 'Blurred output',
    },
    thresholding: {
      title: 'Thresholding',
      summary: 'Turn continuous grayscale values into a binary foreground/background mask.',
      sourceKind: 'grayscale',
      outputLabel: 'Thresholded mask',
    },
    dilation: {
      title: 'Dilation',
      summary: 'Grow bright mask regions outward so narrow gaps close and thin structures thicken.',
      sourceKind: 'mask',
      outputLabel: 'Dilated mask',
    },
    erosion: {
      title: 'Erosion',
      summary: 'Shrink bright mask regions so thin noise disappears and boundaries contract.',
      sourceKind: 'mask',
      outputLabel: 'Eroded mask',
    },
    'opening-closing': {
      title: 'Opening / closing',
      summary: 'Chain morphology passes to remove specks or fill holes without manually touching every pixel.',
      sourceKind: 'mask',
      outputLabel: 'Composite output',
    },
    'sobel-edge-detection': {
      title: 'Sobel edge detection',
      summary: 'Estimate local gradients to highlight where intensity changes sharply across the image.',
      sourceKind: 'grayscale',
      outputLabel: 'Edge magnitude',
    },
  };

  export let mode: DemoMode;

  let sourceCanvas: HTMLCanvasElement;
  let outputCanvas: HTMLCanvasElement;

  let status = 'Checking WebGPU support...';
  let webGpuUnavailable = false;
  let initialized = false;

  let blurRadius = 3;
  let operationIterations = 1;
  let sigma = 1.8;
  let threshold = 0.52;
  let morphologyRadius = 2;
  let openingClosingMode: 'opening' | 'closing' = 'opening';
  let edgeThreshold = 0.2;
  let edgeStrength = 2.6;

  let device: GPUDevice | undefined;
  let context: GPUCanvasContext | undefined;
  let presentationFormat: GPUTextureFormat | undefined;
  let uniformBuffer: GPUBuffer | undefined;
  let nearestSampler: GPUSampler | undefined;
  let sourceTexture: GPUTexture | undefined;
  let sourceView: GPUTextureView | undefined;
  let intermediateTexture: GPUTexture | undefined;
  let scratchTexture: GPUTexture | undefined;
  let sourcePixels: Uint8ClampedArray | undefined;

  const pipelineCache = new Map<string, GPURenderPipeline>();

  function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  function softStep(edge0: number, edge1: number, x: number): number {
    const t = clamp01((x - edge0) / Math.max(edge1 - edge0, 1e-6));
    return t * t * (3 - 2 * t);
  }

  function createGrayscaleSource(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = (x - width * 0.5) / width;
        const ny = (y - height * 0.5) / height;
        const distance = Math.sqrt(nx * nx + ny * ny);

        const baseGradient = 0.18 + 0.42 * ((x / width) * 0.65 + (y / height) * 0.35);
        const circle = softStep(0.21, 0.18, Math.hypot(nx + 0.17, ny + 0.08));
        const square = Math.abs(nx - 0.2) < 0.11 && Math.abs(ny - 0.18) < 0.11 ? 0.72 : 0;
        const stripe = Math.abs(ny + 0.26 - nx * 0.55) < 0.028 ? 0.95 : 0;
        const ringOuter = softStep(0.3, 0.26, Math.hypot(nx - 0.18, ny + 0.14));
        const ringInner = softStep(0.14, 0.11, Math.hypot(nx - 0.18, ny + 0.14));
        const ring = clamp01(ringOuter - ringInner);
        const deterministicNoise = (((x * 17 + y * 31) % 23) / 22 - 0.5) * 0.12;
        const vignette = clamp01(1.0 - distance * 1.15);

        const value = clamp01(
          (baseGradient + circle * 0.6 + square * 0.55 + stripe * 0.4 + ring * 0.35 + deterministicNoise)
            * (0.55 + vignette * 0.45),
        );
        const byte = Math.round(value * 255);
        const index = (y * width + x) * 4;

        pixels[index] = byte;
        pixels[index + 1] = byte;
        pixels[index + 2] = byte;
        pixels[index + 3] = 255;
      }
    }

    return pixels;
  }

  function createMaskSource(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx1 = x - 78;
        const dy1 = y - 96;
        const dx2 = x - 172;
        const dy2 = y - 152;

        let value = 0;

        if (dx1 * dx1 + dy1 * dy1 < 42 * 42) {
          value = 1;
        }
        if (x > 138 && x < 214 && y > 52 && y < 102) {
          value = 1;
        }
        if (Math.abs((y - 182) - (x - 46) * 0.42) < 8 && x > 38 && x < 140) {
          value = 1;
        }
        if (dx2 * dx2 + dy2 * dy2 < 18 * 18) {
          value = 0;
        }
        if (x > 160 && x < 170 && y > 66 && y < 94) {
          value = 0;
        }
        if ((x * 19 + y * 11) % 173 === 0) {
          value = 1;
        }
        if ((x * 7 + y * 13) % 211 === 0) {
          value = 0;
        }

        const byte = value > 0.5 ? 255 : 0;
        const index = (y * width + x) * 4;

        pixels[index] = byte;
        pixels[index + 1] = byte;
        pixels[index + 2] = byte;
        pixels[index + 3] = 255;
      }
    }

    return pixels;
  }

  function currentSourcePixels(): Uint8ClampedArray {
    return demoConfigs[mode].sourceKind === 'mask' ? createMaskSource() : createGrayscaleSource();
  }

  function drawSourcePreview() {
    if (!sourceCanvas || !sourcePixels) {
      return;
    }

    const context2d = sourceCanvas.getContext('2d');
    if (!context2d) {
      return;
    }

    context2d.putImageData(new ImageData(sourcePixels, width, height), 0, 0);
  }

  function createSourceTexture() {
    if (!device || !sourcePixels) {
      return;
    }

    sourceTexture?.destroy();
    sourceTexture = device.createTexture({
      size: { width, height, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    sourceView = sourceTexture.createView();

    device.queue.writeTexture(
      { texture: sourceTexture },
      sourcePixels,
      { bytesPerRow: width * 4, rowsPerImage: height },
      { width, height, depthOrArrayLayers: 1 },
    );
  }

  function createWorkingTexture(): GPUTexture | undefined {
    if (!device || !presentationFormat) {
      return undefined;
    }

    return device.createTexture({
      size: { width, height, depthOrArrayLayers: 1 },
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  function recreateWorkingTextures() {
    intermediateTexture?.destroy();
    scratchTexture?.destroy();
    intermediateTexture = createWorkingTexture();
    scratchTexture = createWorkingTexture();
  }

  function fullscreenVertexShader(): string {
    return `
      @vertex
      fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        var positions = array<vec2f, 3>(
          vec2f(-1.0, -1.0),
          vec2f(3.0, -1.0),
          vec2f(-1.0, 3.0),
        );
        let position = positions[vertexIndex];
        return vec4f(position, 0.0, 1.0);
      }
    `;
  }

  function shaderPrelude(): string {
    return `
      struct Params {
        values: array<f32, 8>,
      };

      @group(0) @binding(0) var inputSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> params: Params;

      fn dims() -> vec2f {
        return vec2f(params.values[0], params.values[1]);
      }

      fn texel() -> vec2f {
        return vec2f(1.0 / params.values[0], 1.0 / params.values[1]);
      }

      fn sampleGray(uv: vec2f) -> f32 {
        let color = textureSample(inputTexture, inputSampler, clamp(uv, vec2f(0.0), vec2f(1.0))).rgb;
        return dot(color, vec3f(0.2126, 0.7152, 0.0722));
      }

      fn binaryValue(uv: vec2f, threshold: f32) -> f32 {
        return select(0.0, 1.0, sampleGray(uv) >= threshold);
      }
    `;
  }

  function fragmentShader(stage: 'gaussian' | 'threshold' | 'morphology' | 'sobel'): string {
    if (stage === 'gaussian') {
      return `${shaderPrelude()}
        const MAX_RADIUS: i32 = ${maxKernelRadius};

        fn gaussianWeight(dx: f32, dy: f32, sigma: f32) -> f32 {
          let variance = max(2.0 * sigma * sigma, 0.0001);
          return exp(-((dx * dx) + (dy * dy)) / variance);
        }

        @fragment
        fn main(@builtin(position) position: vec4f) -> @location(0) vec4f {
          let uv = position.xy / dims();
          let step = texel();
          let radius = i32(params.values[2]);
          let sigma = max(params.values[3], 0.2);

          var totalWeight = 0.0;
          var totalColor = vec3f(0.0);

          for (var dy = -MAX_RADIUS; dy <= MAX_RADIUS; dy = dy + 1) {
            if (abs(dy) > radius) {
              continue;
            }

            for (var dx = -MAX_RADIUS; dx <= MAX_RADIUS; dx = dx + 1) {
              if (abs(dx) > radius) {
                continue;
              }

              let weight = gaussianWeight(f32(dx), f32(dy), sigma);
              let sampleUv = uv + vec2f(f32(dx), f32(dy)) * step;
              let sampleColor = textureSample(inputTexture, inputSampler, clamp(sampleUv, vec2f(0.0), vec2f(1.0))).rgb;
              totalColor = totalColor + sampleColor * weight;
              totalWeight = totalWeight + weight;
            }
          }

          return vec4f(totalColor / max(totalWeight, 0.0001), 1.0);
        }
      `;
    }

    if (stage === 'threshold') {
      return `${shaderPrelude()}
        @fragment
        fn main(@builtin(position) position: vec4f) -> @location(0) vec4f {
          let uv = position.xy / dims();
          let cutoff = params.values[4];
          let value = binaryValue(uv, cutoff);
          return vec4f(vec3f(value), 1.0);
        }
      `;
    }

    if (stage === 'morphology') {
      return `${shaderPrelude()}
        const MAX_RADIUS: i32 = ${maxKernelRadius};

        @fragment
        fn main(@builtin(position) position: vec4f) -> @location(0) vec4f {
          let uv = position.xy / dims();
          let step = texel();
          let radius = i32(params.values[2]);
          let cutoff = params.values[4];
          let isDilate = params.values[5] > 0.5;

          var result = select(1.0, 0.0, isDilate);

          for (var dy = -MAX_RADIUS; dy <= MAX_RADIUS; dy = dy + 1) {
            if (abs(dy) > radius) {
              continue;
            }

            for (var dx = -MAX_RADIUS; dx <= MAX_RADIUS; dx = dx + 1) {
              if (abs(dx) > radius) {
                continue;
              }

              let sampleUv = uv + vec2f(f32(dx), f32(dy)) * step;
              let value = binaryValue(sampleUv, cutoff);

              if (isDilate) {
                result = max(result, value);
              } else {
                result = min(result, value);
              }
            }
          }

          return vec4f(vec3f(result), 1.0);
        }
      `;
    }

    return `${shaderPrelude()}
      fn sobelX(uv: vec2f, step: vec2f) -> f32 {
        return -sampleGray(uv + vec2f(-step.x, -step.y))
          + sampleGray(uv + vec2f(step.x, -step.y))
          - 2.0 * sampleGray(uv + vec2f(-step.x, 0.0))
          + 2.0 * sampleGray(uv + vec2f(step.x, 0.0))
          - sampleGray(uv + vec2f(-step.x, step.y))
          + sampleGray(uv + vec2f(step.x, step.y));
      }

      fn sobelY(uv: vec2f, step: vec2f) -> f32 {
        return -sampleGray(uv + vec2f(-step.x, -step.y))
          - 2.0 * sampleGray(uv + vec2f(0.0, -step.y))
          - sampleGray(uv + vec2f(step.x, -step.y))
          + sampleGray(uv + vec2f(-step.x, step.y))
          + 2.0 * sampleGray(uv + vec2f(0.0, step.y))
          + sampleGray(uv + vec2f(step.x, step.y));
      }

      @fragment
      fn main(@builtin(position) position: vec4f) -> @location(0) vec4f {
        let uv = position.xy / dims();
        let step = texel();
        let gx = sobelX(uv, step);
        let gy = sobelY(uv, step);
        let magnitude = length(vec2f(gx, gy)) * params.values[7];
        let cutoff = params.values[6];
        let normalized = clamp((magnitude - cutoff) / max(1.0 - cutoff, 0.0001), 0.0, 1.0);
        return vec4f(vec3f(normalized), 1.0);
      }
    `;
  }

  function getPipeline(stage: 'gaussian' | 'threshold' | 'morphology' | 'sobel'): GPURenderPipeline {
    if (!device || !presentationFormat) {
      throw new Error('WebGPU pipeline requested before initialization.');
    }

    const cacheKey = `${stage}:${presentationFormat}`;
    const cached = pipelineCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({ code: fullscreenVertexShader() }),
        entryPoint: 'main',
      },
      fragment: {
        module: device.createShaderModule({ code: fragmentShader(stage) }),
        entryPoint: 'main',
        targets: [{ format: presentationFormat }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    pipelineCache.set(cacheKey, pipeline);
    return pipeline;
  }

  function writeUniforms(options: {
    radius?: number;
    sigma?: number;
    threshold?: number;
    dilate?: boolean;
    edgeThreshold?: number;
    edgeStrength?: number;
  } = {}) {
    if (!device || !uniformBuffer) {
      return;
    }

    const data = new Float32Array(8);
    data[0] = width;
    data[1] = height;
    data[2] = options.radius ?? morphologyRadius;
    data[3] = options.sigma ?? sigma;
    data[4] = options.threshold ?? threshold;
    data[5] = options.dilate ? 1 : 0;
    data[6] = options.edgeThreshold ?? edgeThreshold;
    data[7] = options.edgeStrength ?? edgeStrength;
    device.queue.writeBuffer(uniformBuffer, 0, data);
  }

  function renderStage(
    stage: 'gaussian' | 'threshold' | 'morphology' | 'sobel',
    inputView: GPUTextureView,
    targetView: GPUTextureView,
    options: {
      radius?: number;
      sigma?: number;
      threshold?: number;
      dilate?: boolean;
      edgeThreshold?: number;
      edgeStrength?: number;
    } = {},
  ) {
    if (!device || !uniformBuffer || !nearestSampler) {
      return;
    }

    const pipeline = getPipeline(stage);
    writeUniforms(options);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: nearestSampler },
        { binding: 1, resource: inputView },
        { binding: 2, resource: { buffer: uniformBuffer } },
      ],
    });

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: targetView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();

    device.queue.submit([encoder.finish()]);
  }

  function renderRepeatedStage(
    stage: 'gaussian' | 'morphology',
    finalTargetView: GPUTextureView,
    options: {
      radius?: number;
      sigma?: number;
      threshold?: number;
      dilate?: boolean;
    },
    iterations: number,
  ) {
    if (!sourceView) {
      return;
    }

    const totalPasses = Math.max(1, iterations);
    if (totalPasses === 1) {
      renderStage(stage, sourceView, finalTargetView, options);
      return;
    }

    if (!intermediateTexture || !scratchTexture) {
      return;
    }

    const offscreenViews = [intermediateTexture.createView(), scratchTexture.createView()];
    let inputView = sourceView;

    for (let pass = 0; pass < totalPasses; pass += 1) {
      const isLastPass = pass === totalPasses - 1;
      const targetView = isLastPass ? finalTargetView : offscreenViews[pass % 2];
      renderStage(stage, inputView, targetView, options);

      if (!isLastPass) {
        inputView = offscreenViews[pass % 2];
      }
    }
  }

  function renderFrame() {
    if (!context || !sourceView || !device) {
      return;
    }

    const currentTextureView = context.getCurrentTexture().createView();

    if (mode === 'gaussian-blur') {
      renderRepeatedStage('gaussian', currentTextureView, {
        radius: blurRadius,
        sigma,
      }, operationIterations);
      return;
    }

    if (mode === 'thresholding') {
      renderStage('threshold', sourceView, currentTextureView, {
        threshold,
      });
      return;
    }

    if (mode === 'dilation') {
      renderRepeatedStage('morphology', currentTextureView, {
        radius: morphologyRadius,
        threshold: 0.5,
        dilate: true,
      }, operationIterations);
      return;
    }

    if (mode === 'erosion') {
      renderRepeatedStage('morphology', currentTextureView, {
        radius: morphologyRadius,
        threshold: 0.5,
        dilate: false,
      }, operationIterations);
      return;
    }

    if (mode === 'opening-closing' && intermediateTexture) {
      const intermediateView = intermediateTexture.createView();
      const firstIsDilate = openingClosingMode === 'closing';

      renderStage('morphology', sourceView, intermediateView, {
        radius: morphologyRadius,
        threshold: 0.5,
        dilate: firstIsDilate,
      });
      renderStage('morphology', intermediateView, currentTextureView, {
        radius: morphologyRadius,
        threshold: 0.5,
        dilate: !firstIsDilate,
      });
      return;
    }

    renderStage('sobel', sourceView, currentTextureView, {
      edgeThreshold,
      edgeStrength,
    });
  }

  async function initialize() {
    if (!sourceCanvas || !outputCanvas) {
      return;
    }

    sourcePixels = currentSourcePixels();
    drawSourcePreview();

    if (!('gpu' in navigator) || !navigator.gpu) {
      webGpuUnavailable = true;
      status =
        'WebGPU is unavailable in this browser. Open the page in a current Chromium-based browser with WebGPU enabled to use the demo.';
      return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      webGpuUnavailable = true;
      status = 'No WebGPU adapter was found on this device.';
      return;
    }

    device = await adapter.requestDevice();
    context = outputCanvas.getContext('webgpu');

    if (!context) {
      webGpuUnavailable = true;
      status = 'The browser refused to create a WebGPU canvas context.';
      return;
    }

    presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'opaque',
    });

    uniformBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    nearestSampler = device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
    });

    createSourceTexture();
    recreateWorkingTextures();

    initialized = true;
    status = '';
    renderFrame();
  }

  onMount(() => {
    void initialize();

    return () => {
      sourceTexture?.destroy();
      intermediateTexture?.destroy();
      scratchTexture?.destroy();
      uniformBuffer?.destroy();
    };
  });

  $: renderSignature = `${blurRadius}:${operationIterations}:${sigma}:${threshold}:${morphologyRadius}:${openingClosingMode}:${edgeThreshold}:${edgeStrength}`;
  $: if (initialized && renderSignature) {
    renderFrame();
  }
</script>

<div class="space-y-5">
  <div class="space-y-2">
    <h3 class="text-lg font-semibold">{demoConfigs[mode].title}</h3>
    <p class="text-sm text-muted-foreground">{demoConfigs[mode].summary}</p>
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <p class="font-medium">Source image</p>
        <span class="text-muted-foreground">Procedural input</span>
      </div>
      <canvas bind:this={sourceCanvas} width={width} height={height} class="w-full rounded-2xl border border-border bg-black shadow-sm" />
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <p class="font-medium">WebGPU result</p>
        <span class="text-muted-foreground">{demoConfigs[mode].outputLabel}</span>
      </div>
      <canvas bind:this={outputCanvas} width={width} height={height} class="w-full rounded-2xl border border-border bg-black shadow-sm" />
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-background p-5 space-y-4">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Controls</p>
      <p class="mt-2 text-sm text-muted-foreground">
        Adjust the neighborhood size, repeat count, or decision threshold to see how the shader compounds the result.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#if mode === 'gaussian-blur'}
        <label class="space-y-2 text-sm">
          <span class="font-medium">Kernel radius: {blurRadius}</span>
          <input bind:value={blurRadius} type="range" min="1" max="6" step="1" class="w-full" />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium">Iterations: {operationIterations}</span>
          <input bind:value={operationIterations} type="range" min="1" max="6" step="1" class="w-full" />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium">Sigma: {sigma.toFixed(1)}</span>
          <input bind:value={sigma} type="range" min="0.6" max="4.5" step="0.1" class="w-full" />
        </label>
      {/if}

      {#if mode === 'thresholding'}
        <label class="space-y-2 text-sm">
          <span class="font-medium">Threshold: {threshold.toFixed(2)}</span>
          <input bind:value={threshold} type="range" min="0.1" max="0.9" step="0.01" class="w-full" />
        </label>
      {/if}

      {#if mode === 'dilation' || mode === 'erosion' || mode === 'opening-closing'}
        <label class="space-y-2 text-sm">
          <span class="font-medium">Neighborhood radius: {morphologyRadius}</span>
          <input bind:value={morphologyRadius} type="range" min="1" max="6" step="1" class="w-full" />
        </label>
      {/if}

      {#if mode === 'dilation' || mode === 'erosion'}
        <label class="space-y-2 text-sm">
          <span class="font-medium">Iterations: {operationIterations}</span>
          <input bind:value={operationIterations} type="range" min="1" max="6" step="1" class="w-full" />
        </label>
      {/if}

      {#if mode === 'opening-closing'}
        <label class="space-y-2 text-sm">
          <span class="font-medium">Composite operator</span>
          <select bind:value={openingClosingMode} class="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="opening">Opening (erosion -> dilation)</option>
            <option value="closing">Closing (dilation -> erosion)</option>
          </select>
        </label>
      {/if}

      {#if mode === 'sobel-edge-detection'}
        <label class="space-y-2 text-sm">
          <span class="font-medium">Edge threshold: {edgeThreshold.toFixed(2)}</span>
          <input bind:value={edgeThreshold} type="range" min="0.02" max="0.6" step="0.01" class="w-full" />
        </label>
        <label class="space-y-2 text-sm">
          <span class="font-medium">Edge gain: {edgeStrength.toFixed(1)}</span>
          <input bind:value={edgeStrength} type="range" min="0.8" max="4.5" step="0.1" class="w-full" />
        </label>
      {/if}
    </div>

    {#if status}
      <p class={`text-sm ${webGpuUnavailable ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
        {status}
      </p>
    {:else}
      <p class="text-xs text-muted-foreground">
        Rendered in-browser with WebGPU over a generated input texture so you can tweak the operator without leaving the article.
      </p>
    {/if}
  </div>
</div>
