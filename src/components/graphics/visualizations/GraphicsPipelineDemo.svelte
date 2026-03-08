<script lang="ts">
  import { onMount } from 'svelte';

  type DemoMode =
    | 'clipping'
    | 'rasterization'
    | 'barycentric-interpolation'
    | 'z-buffer'
    | 'bezier-curves'
    | 'ray-marching-sdf'
    | 'shadow-mapping'
    | 'ssao'
    | 'taa';

  interface DemoConfig {
    title: string;
    summary: string;
    sourceLabel: string;
    outputLabel: string;
    helper: string;
  }

  interface Point {
    x: number;
    y: number;
  }

  interface Vertex extends Point {
    z: number;
  }

  const width = 224;
  const height = 160;

  const demoConfigs: Record<DemoMode, DemoConfig> = {
    clipping: {
      title: 'Clipping',
      summary: 'Intersect the primitive with the viewport so downstream stages only see geometry that can still matter.',
      sourceLabel: 'Incoming geometry',
      outputLabel: 'Clipped geometry',
      helper: 'Move the triangle until it crosses the viewport border and compare the original outline to the trimmed result.',
    },
    rasterization: {
      title: 'Rasterization',
      summary: 'Turn continuous triangle coverage into actual pixel cells or samples on a discrete screen grid.',
      sourceLabel: 'Triangle in screen space',
      outputLabel: 'Covered grid cells',
      helper: 'Increase grid resolution to watch the same triangle occupy more precise but smaller cells.',
    },
    'barycentric-interpolation': {
      title: 'Barycentric interpolation',
      summary: 'Use vertex weights that sum to one so attributes vary smoothly across the triangle interior.',
      sourceLabel: 'Vertex colors',
      outputLabel: 'Interpolated interior',
      helper: 'Each colored cell inherits a different mix of the three vertex colors according to its barycentric weights.',
    },
    'z-buffer': {
      title: 'Z-buffer',
      summary: 'Keep the closest fragment at each pixel so visibility stops depending on the order triangles were submitted.',
      sourceLabel: 'Overlapping geometry',
      outputLabel: 'Without vs with depth test',
      helper: 'The left half ignores depth and the right half keeps the nearer fragment at each covered cell.',
    },
    'bezier-curves': {
      title: 'Bezier curves',
      summary: 'Interpolate control points recursively so an editable control polygon produces a smooth parametric curve.',
      sourceLabel: 'Control polygon',
      outputLabel: 'Curve evaluation',
      helper: 'Slide t to watch de Casteljau interpolation collapse the control polygon into a single point on the curve.',
    },
    'ray-marching-sdf': {
      title: 'Ray marching and SDFs',
      summary: 'Advance along a ray by the nearest safe distance reported by the signed distance field until you reach the surface.',
      sourceLabel: 'Scene and step circles',
      outputLabel: 'Distance field view',
      helper: 'Changing the ray angle alters every step size because the distance field changes along the ray path.',
    },
    'shadow-mapping': {
      title: 'Shadow mapping',
      summary: 'Store depth from the light’s perspective, then compare visible points against that light-space depth later.',
      sourceLabel: 'Light-space scene',
      outputLabel: 'Shadowed receiver + shadow map strip',
      helper: 'Moving the light updates both the saved depth profile and the receiver points that fall into shadow.',
    },
    ssao: {
      title: 'SSAO',
      summary: 'Sample nearby depth to estimate how enclosed a visible point feels, then darken it to suggest ambient occlusion.',
      sourceLabel: 'Depth buffer',
      outputLabel: 'Occlusion estimate',
      helper: 'Larger radii spread the effect farther away from corners and contacts, but also make it more approximate.',
    },
    taa: {
      title: 'Temporal anti-aliasing',
      summary: 'Accumulate several jittered frames so thin high-frequency detail stops flickering as violently.',
      sourceLabel: 'Current jittered frame',
      outputLabel: 'Accumulated history',
      helper: 'More frames stabilize the pattern, but too much trust in history can also smear motion in a real renderer.',
    },
  };

  export let mode: DemoMode;

  let sourceCanvas: HTMLCanvasElement;
  let outputCanvas: HTMLCanvasElement;
  let mounted = false;

  let geometryOffset = 12;
  let gridResolution = 14;
  let frontDepth = 0.34;
  let curveT = 0.42;
  let curveBend = 0.62;
  let rayAngle = -0.18;
  let rayStepBudget = 18;
  let lightPosition = 0.28;
  let occlusionRadius = 5;
  let taaFrames = 8;
  let taaPhase = 3;

  let config: DemoConfig = demoConfigs[mode];

  $: config = demoConfigs[mode];

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function clamp01(value: number): number {
    return clamp(value, 0, 1);
  }

  function clearCanvas(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#05070a';
    context.fillRect(0, 0, width, height);
  }

  function drawViewport(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    context.strokeStyle = 'rgba(255,255,255,0.35)';
    context.lineWidth = 1.5;
    context.strokeRect(x, y, w, h);
  }

  function makeTriangle(): Point[] {
    return [
      { x: 34 + geometryOffset, y: 130 },
      { x: 118 + geometryOffset * 0.45, y: 16 + geometryOffset * 0.2 },
      { x: 196 - geometryOffset * 0.25, y: 110 - geometryOffset * 0.35 },
    ];
  }

  function drawPolygon(context: CanvasRenderingContext2D, points: Point[], options: { stroke: string; fill?: string; dash?: number[] }) {
    if (points.length === 0) {
      return;
    }

    context.save();
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }
    context.closePath();
    context.setLineDash(options.dash ?? []);
    if (options.fill) {
      context.fillStyle = options.fill;
      context.fill();
    }
    context.strokeStyle = options.stroke;
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  }

  function clipAgainstEdge(points: Point[], inside: (point: Point) => boolean, intersect: (a: Point, b: Point) => Point): Point[] {
    const output: Point[] = [];

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const previous = points[(index + points.length - 1) % points.length];
      const currentInside = inside(current);
      const previousInside = inside(previous);

      if (currentInside) {
        if (!previousInside) {
          output.push(intersect(previous, current));
        }
        output.push(current);
      } else if (previousInside) {
        output.push(intersect(previous, current));
      }
    }

    return output;
  }

  function clipPolygon(points: Point[], left: number, top: number, right: number, bottom: number): Point[] {
    const safeIntersect = (a: Point, b: Point, t: number): Point => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });

    let output = clipAgainstEdge(
      points,
      point => point.x >= left,
      (a, b) => safeIntersect(a, b, (left - a.x) / Math.max(b.x - a.x, 1e-6)),
    );
    output = clipAgainstEdge(
      output,
      point => point.x <= right,
      (a, b) => safeIntersect(a, b, (right - a.x) / Math.max(b.x - a.x, 1e-6)),
    );
    output = clipAgainstEdge(
      output,
      point => point.y >= top,
      (a, b) => safeIntersect(a, b, (top - a.y) / Math.max(b.y - a.y, 1e-6)),
    );
    output = clipAgainstEdge(
      output,
      point => point.y <= bottom,
      (a, b) => safeIntersect(a, b, (bottom - a.y) / Math.max(b.y - a.y, 1e-6)),
    );

    return output;
  }

  function barycentric(point: Point, triangle: Point[]): [number, number, number] {
    const [a, b, c] = triangle;
    const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    const w0 = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator;
    const w1 = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator;
    const w2 = 1 - w0 - w1;
    return [w0, w1, w2];
  }

  function insideTriangle(weights: readonly number[]): boolean {
    return weights[0] >= 0 && weights[1] >= 0 && weights[2] >= 0;
  }

  function drawGrid(context: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, resolution: number) {
    const cellWidth = rect.width / resolution;
    const rows = Math.round(rect.height / cellWidth);
    context.save();
    context.strokeStyle = 'rgba(255,255,255,0.08)';
    context.lineWidth = 1;

    for (let column = 0; column <= resolution; column += 1) {
      const x = rect.x + column * cellWidth;
      context.beginPath();
      context.moveTo(x, rect.y);
      context.lineTo(x, rect.y + rect.height);
      context.stroke();
    }

    for (let row = 0; row <= rows; row += 1) {
      const y = rect.y + row * cellWidth;
      context.beginPath();
      context.moveTo(rect.x, y);
      context.lineTo(rect.x + rect.width, y);
      context.stroke();
    }

    context.restore();
  }

  function drawRasterizationScene(sourceContext: CanvasRenderingContext2D, outputContext: CanvasRenderingContext2D, interpolate = false) {
    const rect = { x: 24, y: 20, width: 176, height: 120 };
    const triangle = [
      { x: 46 + geometryOffset * 0.4, y: 122 },
      { x: 104 + geometryOffset * 0.12, y: 34 },
      { x: 176 - geometryOffset * 0.2, y: 108 - geometryOffset * 0.2 },
    ];
    const cellWidth = rect.width / gridResolution;
    const rows = Math.round(rect.height / cellWidth);
    const colors = [
      [248, 113, 113],
      [34, 197, 94],
      [59, 130, 246],
    ] as const;

    clearCanvas(sourceContext);
    clearCanvas(outputContext);
    drawGrid(sourceContext, rect, gridResolution);
    drawGrid(outputContext, rect, gridResolution);
    drawPolygon(sourceContext, triangle, { stroke: '#fb923c', fill: 'rgba(251,146,60,0.14)' });

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < gridResolution; column += 1) {
        const center = {
          x: rect.x + (column + 0.5) * cellWidth,
          y: rect.y + (row + 0.5) * cellWidth,
        };
        const weights = barycentric(center, triangle);

        if (!insideTriangle(weights)) {
          continue;
        }

        if (interpolate) {
          const r = Math.round(colors[0][0] * weights[0] + colors[1][0] * weights[1] + colors[2][0] * weights[2]);
          const g = Math.round(colors[0][1] * weights[0] + colors[1][1] * weights[1] + colors[2][1] * weights[2]);
          const b = Math.round(colors[0][2] * weights[0] + colors[1][2] * weights[1] + colors[2][2] * weights[2]);
          outputContext.fillStyle = `rgba(${r}, ${g}, ${b}, 0.92)`;
        } else {
          outputContext.fillStyle = 'rgba(45, 212, 191, 0.88)';
        }

        outputContext.fillRect(rect.x + column * cellWidth + 1, rect.y + row * cellWidth + 1, cellWidth - 2, cellWidth - 2);
      }
    }

    if (interpolate) {
      drawPolygon(sourceContext, triangle, { stroke: '#f8fafc' });
      sourceContext.fillStyle = '#f87171';
      sourceContext.beginPath();
      sourceContext.arc(triangle[0].x, triangle[0].y, 5, 0, Math.PI * 2);
      sourceContext.fill();
      sourceContext.fillStyle = '#22c55e';
      sourceContext.beginPath();
      sourceContext.arc(triangle[1].x, triangle[1].y, 5, 0, Math.PI * 2);
      sourceContext.fill();
      sourceContext.fillStyle = '#3b82f6';
      sourceContext.beginPath();
      sourceContext.arc(triangle[2].x, triangle[2].y, 5, 0, Math.PI * 2);
      sourceContext.fill();
    }
  }

  function rasterizeTriangle(context: CanvasRenderingContext2D, rect: { x: number; y: number; width: number; height: number }, triangle: Vertex[], color: string, resolution: number, depthBuffer?: Float32Array, colorBuffer?: string[]) {
    const cellWidth = rect.width / resolution;
    const rows = Math.round(rect.height / cellWidth);
    const triangle2d = triangle.map(vertex => ({ x: vertex.x, y: vertex.y }));

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < resolution; column += 1) {
        const center = {
          x: rect.x + (column + 0.5) * cellWidth,
          y: rect.y + (row + 0.5) * cellWidth,
        };
        const weights = barycentric(center, triangle2d);

        if (!insideTriangle(weights)) {
          continue;
        }

        const depth = weights[0] * triangle[0].z + weights[1] * triangle[1].z + weights[2] * triangle[2].z;
        const pixelIndex = row * resolution + column;

        if (depthBuffer && colorBuffer) {
          if (depth < depthBuffer[pixelIndex]) {
            depthBuffer[pixelIndex] = depth;
            colorBuffer[pixelIndex] = color;
          }
        } else {
          context.fillStyle = color;
          context.fillRect(rect.x + column * cellWidth + 1, rect.y + row * cellWidth + 1, cellWidth - 2, cellWidth - 2);
        }
      }
    }
  }

  function drawZBufferScene(sourceContext: CanvasRenderingContext2D, outputContext: CanvasRenderingContext2D) {
    const rect = { x: 12, y: 24, width: 200, height: 112 };
    const resolution = 16;
    const leftTriangle: Vertex[] = [
      { x: 46, y: 126, z: frontDepth + 0.08 },
      { x: 102, y: 28, z: frontDepth },
      { x: 150, y: 122, z: frontDepth + 0.12 },
    ];
    const rightTriangle: Vertex[] = [
      { x: 88, y: 134, z: 0.62 },
      { x: 162, y: 36, z: 0.58 },
      { x: 202, y: 122, z: 0.6 },
    ];

    clearCanvas(sourceContext);
    clearCanvas(outputContext);
    drawGrid(sourceContext, rect, resolution);
    drawGrid(outputContext, { x: 12, y: 24, width: 96, height: 112 }, resolution);
    drawGrid(outputContext, { x: 116, y: 24, width: 96, height: 112 }, resolution);

    drawPolygon(sourceContext, leftTriangle, { stroke: '#fb7185', fill: 'rgba(251,113,133,0.18)' });
    drawPolygon(sourceContext, rightTriangle, { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.18)' });

    rasterizeTriangle(outputContext, { x: 12, y: 24, width: 96, height: 112 }, leftTriangle.map(vertex => ({ ...vertex, x: vertex.x * 0.48 - 10 })), 'rgba(251,113,133,0.85)', resolution);
    rasterizeTriangle(outputContext, { x: 12, y: 24, width: 96, height: 112 }, rightTriangle.map(vertex => ({ ...vertex, x: vertex.x * 0.48 - 10 })), 'rgba(96,165,250,0.85)', resolution);

    const depthBuffer = new Float32Array(resolution * Math.round(112 / (96 / resolution)));
    depthBuffer.fill(Number.POSITIVE_INFINITY);
    const colorBuffer = new Array<string>(depthBuffer.length).fill('rgba(0,0,0,0)');
    const rightRect = { x: 116, y: 24, width: 96, height: 112 };

    rasterizeTriangle(outputContext, rightRect, leftTriangle.map(vertex => ({ ...vertex, x: vertex.x * 0.48 + 94 })), 'rgba(251,113,133,0.85)', resolution, depthBuffer, colorBuffer);
    rasterizeTriangle(outputContext, rightRect, rightTriangle.map(vertex => ({ ...vertex, x: vertex.x * 0.48 + 94 })), 'rgba(96,165,250,0.85)', resolution, depthBuffer, colorBuffer);

    const cellWidth = rightRect.width / resolution;
    const rows = Math.round(rightRect.height / cellWidth);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < resolution; column += 1) {
        const color = colorBuffer[row * resolution + column];
        if (color === 'rgba(0,0,0,0)') {
          continue;
        }
        outputContext.fillStyle = color;
        outputContext.fillRect(rightRect.x + column * cellWidth + 1, rightRect.y + row * cellWidth + 1, cellWidth - 2, cellWidth - 2);
      }
    }
  }

  function interpolatePoint(a: Point, b: Point, t: number): Point {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  function drawBezierScene(sourceContext: CanvasRenderingContext2D, outputContext: CanvasRenderingContext2D) {
    const points = [
      { x: 24, y: 128 },
      { x: 72, y: 30 + (1 - curveBend) * 56 },
      { x: 144, y: 32 + curveBend * 60 },
      { x: 196, y: 118 },
    ];
    const level1 = [
      interpolatePoint(points[0], points[1], curveT),
      interpolatePoint(points[1], points[2], curveT),
      interpolatePoint(points[2], points[3], curveT),
    ];
    const level2 = [
      interpolatePoint(level1[0], level1[1], curveT),
      interpolatePoint(level1[1], level1[2], curveT),
    ];
    const curvePoint = interpolatePoint(level2[0], level2[1], curveT);

    clearCanvas(sourceContext);
    clearCanvas(outputContext);

    drawPolygon(sourceContext, points, { stroke: 'rgba(255,255,255,0.25)' });
    drawPolygon(sourceContext, level1, { stroke: 'rgba(251,146,60,0.65)' });
    drawPolygon(sourceContext, level2, { stroke: 'rgba(45,212,191,0.85)' });

    sourceContext.fillStyle = '#f8fafc';
    for (const point of points) {
      sourceContext.beginPath();
      sourceContext.arc(point.x, point.y, 4, 0, Math.PI * 2);
      sourceContext.fill();
    }
    sourceContext.fillStyle = '#f97316';
    for (const point of level1) {
      sourceContext.beginPath();
      sourceContext.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      sourceContext.fill();
    }
    sourceContext.fillStyle = '#2dd4bf';
    for (const point of level2) {
      sourceContext.beginPath();
      sourceContext.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      sourceContext.fill();
    }
    sourceContext.fillStyle = '#ffffff';
    sourceContext.beginPath();
    sourceContext.arc(curvePoint.x, curvePoint.y, 4.5, 0, Math.PI * 2);
    sourceContext.fill();

    outputContext.strokeStyle = '#f8fafc';
    outputContext.lineWidth = 2.5;
    outputContext.beginPath();
    outputContext.moveTo(points[0].x, points[0].y);
    for (let step = 1; step <= 80; step += 1) {
      const t = step / 80;
      const a = interpolatePoint(points[0], points[1], t);
      const b = interpolatePoint(points[1], points[2], t);
      const c = interpolatePoint(points[2], points[3], t);
      const d = interpolatePoint(a, b, t);
      const e = interpolatePoint(b, c, t);
      const current = interpolatePoint(d, e, t);
      outputContext.lineTo(current.x, current.y);
    }
    outputContext.stroke();
    outputContext.fillStyle = '#38bdf8';
    outputContext.beginPath();
    outputContext.arc(curvePoint.x, curvePoint.y, 5, 0, Math.PI * 2);
    outputContext.fill();
  }

  function sdfCircle(point: Point, center: Point, radius: number): number {
    return Math.hypot(point.x - center.x, point.y - center.y) - radius;
  }

  function sdfBox(point: Point, center: Point, halfSize: Point): number {
    const dx = Math.abs(point.x - center.x) - halfSize.x;
    const dy = Math.abs(point.y - center.y) - halfSize.y;
    const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
    const inside = Math.min(Math.max(dx, dy), 0);
    return outside + inside;
  }

  function sceneSdf(point: Point): number {
    return Math.min(
      sdfCircle(point, { x: 82, y: 84 }, 28),
      sdfBox(point, { x: 154, y: 66 }, { x: 26, y: 20 }),
    );
  }

  function drawRayMarchingScene(sourceContext: CanvasRenderingContext2D, outputContext: CanvasRenderingContext2D) {
    const origin = { x: 20, y: 132 };
    const direction = { x: Math.cos(rayAngle), y: Math.sin(rayAngle) };
    const points: Point[] = [];
    let traveled = 0;
    let hitPoint: Point | undefined;

    for (let step = 0; step < rayStepBudget; step += 1) {
      const point = { x: origin.x + direction.x * traveled, y: origin.y + direction.y * traveled };
      points.push(point);
      const distance = sceneSdf(point);
      if (distance < 1.2) {
        hitPoint = point;
        break;
      }
      traveled += distance;
      if (traveled > 260) {
        break;
      }
    }

    clearCanvas(sourceContext);
    clearCanvas(outputContext);

    sourceContext.strokeStyle = 'rgba(248,250,252,0.7)';
    sourceContext.lineWidth = 2;
    sourceContext.beginPath();
    sourceContext.arc(82, 84, 28, 0, Math.PI * 2);
    sourceContext.stroke();
    sourceContext.strokeRect(128, 46, 52, 40);

    sourceContext.strokeStyle = 'rgba(45,212,191,0.75)';
    sourceContext.beginPath();
    sourceContext.moveTo(origin.x, origin.y);
    const rayEnd = { x: origin.x + direction.x * 220, y: origin.y + direction.y * 220 };
    sourceContext.lineTo(rayEnd.x, rayEnd.y);
    sourceContext.stroke();

    for (const point of points) {
      const distance = sceneSdf(point);
      sourceContext.strokeStyle = 'rgba(251,146,60,0.32)';
      sourceContext.beginPath();
      sourceContext.arc(point.x, point.y, Math.max(distance, 1), 0, Math.PI * 2);
      sourceContext.stroke();
      sourceContext.fillStyle = '#f8fafc';
      sourceContext.beginPath();
      sourceContext.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
      sourceContext.fill();
    }

    if (hitPoint) {
      sourceContext.fillStyle = '#38bdf8';
      sourceContext.beginPath();
      sourceContext.arc(hitPoint.x, hitPoint.y, 4.5, 0, Math.PI * 2);
      sourceContext.fill();
    }

    const context = outputContext;
    const stepSize = 4;
    for (let y = 0; y < height; y += stepSize) {
      for (let x = 0; x < width; x += stepSize) {
        const distance = sceneSdf({ x, y });
        const normalized = clamp01(0.5 + distance / 40);
        context.fillStyle = `rgb(${Math.round(40 + normalized * 150)}, ${Math.round(55 + (1 - normalized) * 110)}, ${Math.round(120 + (1 - normalized) * 100)})`;
        context.fillRect(x, y, stepSize, stepSize);
      }
    }
    context.strokeStyle = 'rgba(255,255,255,0.5)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(82, 84, 28, 0, Math.PI * 2);
    context.stroke();
    context.strokeRect(128, 46, 52, 40);
    context.beginPath();
    context.moveTo(origin.x, origin.y);
    context.lineTo(rayEnd.x, rayEnd.y);
    context.stroke();
    if (hitPoint) {
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.arc(hitPoint.x, hitPoint.y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }

  function blockerIntersection(light: Point, receiverX: number): number | undefined {
    const blockerLeft = 92;
    const blockerRight = 128;
    const blockerTop = 48;
    const blockerBottom = 92;
    const receiverY = 130;
    const tToGround = (receiverY - light.y) / Math.max(receiverY - light.y, 1e-6);
    const _ = tToGround;

    if (receiverX === light.x) {
      return receiverX >= blockerLeft && receiverX <= blockerRight ? blockerTop : undefined;
    }

    const directionX = receiverX - light.x;
    const directionY = receiverY - light.y;
    let nearest: number | undefined;

    const checkT = (t: number, yAtT: number, xAtT: number) => {
      if (t <= 0 || t >= 1) {
        return;
      }
      if (xAtT >= blockerLeft && xAtT <= blockerRight && yAtT >= blockerTop && yAtT <= blockerBottom) {
        nearest = nearest === undefined ? t : Math.min(nearest, t);
      }
    };

    const tLeft = (blockerLeft - light.x) / directionX;
    checkT(tLeft, light.y + directionY * tLeft, blockerLeft);
    const tRight = (blockerRight - light.x) / directionX;
    checkT(tRight, light.y + directionY * tRight, blockerRight);

    if (directionY !== 0) {
      const tTop = (blockerTop - light.y) / directionY;
      checkT(tTop, blockerTop, light.x + directionX * tTop);
      const tBottom = (blockerBottom - light.y) / directionY;
      checkT(tBottom, blockerBottom, light.x + directionX * tBottom);
    }

    if (nearest === undefined) {
      return undefined;
    }

    return Math.hypot(directionX, directionY) * nearest;
  }

  function drawShadowMappingScene(sourceContext: CanvasRenderingContext2D, outputContext: CanvasRenderingContext2D) {
    const light = { x: 32 + lightPosition * 160, y: 18 };
    const receiverY = 130;
    const blocker = { x: 92, y: 48, width: 36, height: 44 };

    clearCanvas(sourceContext);
    clearCanvas(outputContext);

    sourceContext.strokeStyle = 'rgba(255,255,255,0.3)';
    sourceContext.strokeRect(blocker.x, blocker.y, blocker.width, blocker.height);
    sourceContext.beginPath();
    sourceContext.moveTo(12, receiverY);
    sourceContext.lineTo(212, receiverY);
    sourceContext.stroke();
    sourceContext.fillStyle = '#facc15';
    sourceContext.beginPath();
    sourceContext.arc(light.x, light.y, 6, 0, Math.PI * 2);
    sourceContext.fill();
    sourceContext.fillStyle = 'rgba(96,165,250,0.25)';
    sourceContext.fillRect(blocker.x, blocker.y, blocker.width, blocker.height);

    for (let x = 16; x <= 208; x += 8) {
      sourceContext.strokeStyle = 'rgba(250,204,21,0.18)';
      sourceContext.beginPath();
      sourceContext.moveTo(light.x, light.y);
      sourceContext.lineTo(x, receiverY);
      sourceContext.stroke();
    }

    const sampleCount = 40;
    const shadowMapDepths: number[] = [];
    for (let sample = 0; sample < sampleCount; sample += 1) {
      const x = 16 + (sample / (sampleCount - 1)) * 192;
      const depth = blockerIntersection(light, x) ?? Math.hypot(x - light.x, receiverY - light.y);
      shadowMapDepths.push(depth);
    }

    for (let sample = 0; sample < sampleCount; sample += 1) {
      const x = 16 + (sample / (sampleCount - 1)) * 192;
      const groundDepth = Math.hypot(x - light.x, receiverY - light.y);
      const storedDepth = shadowMapDepths[sample];
      const isShadowed = groundDepth > storedDepth + 2;

      outputContext.fillStyle = isShadowed ? 'rgba(31,41,55,0.95)' : 'rgba(250,204,21,0.85)';
      outputContext.fillRect(x - 2.5, 92, 5, 38);

      const normalizedDepth = clamp01(storedDepth / 220);
      outputContext.fillStyle = 'rgba(148,163,184,0.95)';
      outputContext.fillRect(x - 2.5, 56 - normalizedDepth * 32, 5, normalizedDepth * 32);
    }

    outputContext.strokeStyle = 'rgba(255,255,255,0.35)';
    outputContext.strokeRect(14, 20, 196, 38);
    outputContext.strokeRect(14, 92, 196, 38);
  }

  function buildDepthField(gridWidth: number, gridHeight: number): Float32Array {
    const field = new Float32Array(gridWidth * gridHeight);

    for (let y = 0; y < gridHeight; y += 1) {
      for (let x = 0; x < gridWidth; x += 1) {
        const nx = x / gridWidth;
        const ny = y / gridHeight;
        const step = nx > 0.42 && ny > 0.42 ? 0.72 : 0.38;
        const pillar = Math.hypot(nx - 0.72, ny - 0.58) < 0.14 ? 0.18 : 0;
        const groove = Math.abs(nx - 0.22) < 0.06 && ny > 0.2 ? 0.12 : 0;
        field[y * gridWidth + x] = clamp01(step - pillar + groove);
      }
    }

    return field;
  }

  function drawField(context: CanvasRenderingContext2D, field: Float32Array, gridWidth: number, gridHeight: number, colorize: (value: number) => string) {
    const image = context.createImageData(gridWidth, gridHeight);

    for (let index = 0; index < field.length; index += 1) {
      const color = colorize(field[index]).match(/\d+/g)?.map(value => Number(value)) ?? [0, 0, 0];
      const offset = index * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = 255;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gridWidth;
    tempCanvas.height = gridHeight;
    const tempContext = tempCanvas.getContext('2d');
    if (!tempContext) {
      return;
    }
    tempContext.putImageData(image, 0, 0);
    context.imageSmoothingEnabled = true;
    context.drawImage(tempCanvas, 0, 0, width, height);
  }

  function drawSsaoScene(sourceContext: CanvasRenderingContext2D, outputContext: CanvasRenderingContext2D) {
    const gridWidth = 112;
    const gridHeight = 80;
    const depth = buildDepthField(gridWidth, gridHeight);
    const occlusion = new Float32Array(depth.length);

    for (let y = 0; y < gridHeight; y += 1) {
      for (let x = 0; x < gridWidth; x += 1) {
        const center = depth[y * gridWidth + x];
        let total = 0;
        let count = 0;

        for (let dy = -occlusionRadius; dy <= occlusionRadius; dy += 1) {
          for (let dx = -occlusionRadius; dx <= occlusionRadius; dx += 1) {
            const nextX = x + dx;
            const nextY = y + dy;
            if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) {
              continue;
            }
            if (dx === 0 && dy === 0) {
              continue;
            }
            const neighbor = depth[nextY * gridWidth + nextX];
            total += Math.max(0, neighbor - center);
            count += 1;
          }
        }

        occlusion[y * gridWidth + x] = clamp01((total / Math.max(count, 1)) * 4.2);
      }
    }

    clearCanvas(sourceContext);
    clearCanvas(outputContext);
    drawField(sourceContext, depth, gridWidth, gridHeight, value => {
      const shade = Math.round(value * 255);
      return `rgb(${shade}, ${shade}, ${shade})`;
    });
    drawField(outputContext, occlusion, gridWidth, gridHeight, value => {
      const shade = Math.round((1 - value) * 255);
      return `rgb(${shade}, ${Math.round(shade * 0.95)}, ${Math.round(shade * 0.9)})`;
    });
  }

  function sampleFence(x: number, y: number, jitter: number): number {
    const shiftedX = x + jitter;
    const stripe = Math.sin(shiftedX * 0.42) * 0.5 + 0.5;
    const slat = Math.sin((shiftedX + y * 0.35) * 0.95) * 0.5 + 0.5;
    return stripe > 0.52 || slat > 0.64 ? 1 : 0;
  }

  function drawTaaField(context: CanvasRenderingContext2D, frameCount: number, phase: number, accumulated: boolean) {
    const image = context.createImageData(width, height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let value = 0;

        if (accumulated) {
          for (let frame = 0; frame < frameCount; frame += 1) {
            const jitter = ((phase + frame) % frameCount) / frameCount - 0.5;
            value += sampleFence(x, y, jitter);
          }
          value /= frameCount;
        } else {
          const jitter = (phase % frameCount) / frameCount - 0.5;
          value = sampleFence(x, y, jitter);
        }

        const offset = (y * width + x) * 4;
        const shade = Math.round(value * 255);
        image.data[offset] = shade;
        image.data[offset + 1] = shade;
        image.data[offset + 2] = shade;
        image.data[offset + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }

  function updateCanvases() {
    if (!mounted || !sourceCanvas || !outputCanvas) {
      return;
    }

    const sourceContext = sourceCanvas.getContext('2d');
    const outputContext = outputCanvas.getContext('2d');

    if (!sourceContext || !outputContext) {
      return;
    }

    if (mode === 'clipping') {
      const viewport = { x: 28, y: 20, width: 168, height: 116 };
      const triangle = makeTriangle();
      const clipped = clipPolygon(triangle, viewport.x, viewport.y, viewport.x + viewport.width, viewport.y + viewport.height);

      clearCanvas(sourceContext);
      clearCanvas(outputContext);
      drawViewport(sourceContext, viewport.x, viewport.y, viewport.width, viewport.height);
      drawViewport(outputContext, viewport.x, viewport.y, viewport.width, viewport.height);
      drawPolygon(sourceContext, triangle, { stroke: '#fb923c', fill: 'rgba(251,146,60,0.14)', dash: [8, 6] });
      drawPolygon(outputContext, clipped, { stroke: '#2dd4bf', fill: 'rgba(45,212,191,0.22)' });
      return;
    }

    if (mode === 'rasterization') {
      drawRasterizationScene(sourceContext, outputContext, false);
      return;
    }

    if (mode === 'barycentric-interpolation') {
      drawRasterizationScene(sourceContext, outputContext, true);
      return;
    }

    if (mode === 'z-buffer') {
      drawZBufferScene(sourceContext, outputContext);
      return;
    }

    if (mode === 'bezier-curves') {
      drawBezierScene(sourceContext, outputContext);
      return;
    }

    if (mode === 'ray-marching-sdf') {
      drawRayMarchingScene(sourceContext, outputContext);
      return;
    }

    if (mode === 'shadow-mapping') {
      drawShadowMappingScene(sourceContext, outputContext);
      return;
    }

    if (mode === 'ssao') {
      drawSsaoScene(sourceContext, outputContext);
      return;
    }

    clearCanvas(sourceContext);
    clearCanvas(outputContext);
    drawTaaField(sourceContext, Math.max(taaFrames, 1), taaPhase, false);
    drawTaaField(outputContext, Math.max(taaFrames, 1), taaPhase, true);
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
        <span class="text-xs text-muted-foreground">Scene view</span>
      </div>
      <canvas bind:this={sourceCanvas} width={width} height={height} class="w-full rounded-xl border border-border bg-black/80 object-contain" />
    </div>

    <div class="rounded-2xl border border-border bg-background/60 p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-foreground">{config.outputLabel}</p>
        <span class="text-xs text-muted-foreground">Result view</span>
      </div>
      <canvas bind:this={outputCanvas} width={width} height={height} class="w-full rounded-xl border border-border bg-black/80 object-contain" />
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-card/70 p-4">
    <p class="text-sm text-muted-foreground leading-relaxed">
      {config.helper}
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    {#if mode === 'clipping' || mode === 'rasterization' || mode === 'barycentric-interpolation'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">{mode === 'clipping' ? 'Triangle offset' : 'Geometry skew'}</span>
          <span class="text-xs text-muted-foreground">{geometryOffset.toFixed(0)}</span>
        </div>
        <input bind:value={geometryOffset} type="range" min="-32" max="36" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'rasterization' || mode === 'barycentric-interpolation' || mode === 'z-buffer'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Grid resolution</span>
          <span class="text-xs text-muted-foreground">{gridResolution}</span>
        </div>
        <input bind:value={gridResolution} type="range" min="10" max="22" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'z-buffer'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Front triangle depth</span>
          <span class="text-xs text-muted-foreground">{frontDepth.toFixed(2)}</span>
        </div>
        <input bind:value={frontDepth} type="range" min="0.1" max="0.65" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'bezier-curves'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Parameter t</span>
          <span class="text-xs text-muted-foreground">{curveT.toFixed(2)}</span>
        </div>
        <input bind:value={curveT} type="range" min="0" max="1" step="0.01" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Middle control bend</span>
          <span class="text-xs text-muted-foreground">{curveBend.toFixed(2)}</span>
        </div>
        <input bind:value={curveBend} type="range" min="0.1" max="0.9" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'ray-marching-sdf'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Ray angle</span>
          <span class="text-xs text-muted-foreground">{rayAngle.toFixed(2)} rad</span>
        </div>
        <input bind:value={rayAngle} type="range" min="-0.8" max="0.35" step="0.01" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Step budget</span>
          <span class="text-xs text-muted-foreground">{rayStepBudget}</span>
        </div>
        <input bind:value={rayStepBudget} type="range" min="4" max="28" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'shadow-mapping'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Light position</span>
          <span class="text-xs text-muted-foreground">{lightPosition.toFixed(2)}</span>
        </div>
        <input bind:value={lightPosition} type="range" min="0.05" max="0.95" step="0.01" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'ssao'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Neighborhood radius</span>
          <span class="text-xs text-muted-foreground">{occlusionRadius}</span>
        </div>
        <input bind:value={occlusionRadius} type="range" min="2" max="10" step="1" class="w-full accent-primary" />
      </label>
    {/if}

    {#if mode === 'taa'}
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Accumulated frames</span>
          <span class="text-xs text-muted-foreground">{taaFrames}</span>
        </div>
        <input bind:value={taaFrames} type="range" min="2" max="16" step="1" class="w-full accent-primary" />
      </label>
      <label class="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-foreground">Current frame index</span>
          <span class="text-xs text-muted-foreground">{taaPhase}</span>
        </div>
        <input bind:value={taaPhase} type="range" min="0" max="15" step="1" class="w-full accent-primary" />
      </label>
    {/if}
  </div>
</div>
