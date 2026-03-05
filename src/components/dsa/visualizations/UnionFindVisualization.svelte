<script lang="ts">
  import { onMount } from 'svelte';

  const N = 7;
  let parent: number[] = [];
  let rank: number[] = [];
  let running = false;
  let log: string[] = [];

  // Edges to union (demonstrate connectivity)
  const unionOps: [number, number][] = [
    [0, 1], [2, 3], [4, 5], [1, 3], [5, 6], [0, 6],
  ];
  let currentOp = -1;

  const nodePositions: { x: number; y: number }[] = [
    { x: 55, y: 50 },
    { x: 120, y: 50 },
    { x: 200, y: 50 },
    { x: 280, y: 50 },
    { x: 340, y: 50 },
    { x: 160, y: 50 },
    { x: 230, y: 50 },
  ];

  // Dynamic positions based on tree structure
  function computePositions(): { x: number; y: number }[] {
    const roots: number[] = [];
    const children: Record<number, number[]> = {};

    for (let i = 0; i < N; i++) {
      if (parent[i] === i) {
        roots.push(i);
        children[i] = [];
      }
    }
    for (let i = 0; i < N; i++) {
      if (parent[i] !== i) {
        const r = find(i);
        if (!children[r]) children[r] = [];
        if (parent[i] === r) {
          children[r].push(i);
        }
      }
    }

    const pos: { x: number; y: number }[] = new Array(N);
    const treeWidth = 380 / Math.max(roots.length, 1);

    roots.forEach((root, ri) => {
      const cx = 30 + treeWidth * ri + treeWidth / 2;
      pos[root] = { x: cx, y: 60 };
      const ch = children[root] || [];
      const childWidth = Math.min(treeWidth / Math.max(ch.length, 1), 50);
      ch.forEach((child, ci) => {
        const childCx = cx - (ch.length - 1) * childWidth / 2 + ci * childWidth;
        pos[child] = { x: childCx, y: 160 };
      });
    });

    // Fill any missing
    for (let i = 0; i < N; i++) {
      if (!pos[i]) pos[i] = { x: 30 + i * 50, y: 250 };
    }

    return pos;
  }

  function find(x: number): number {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }

  function union(a: number, b: number): boolean {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
    } else {
      parent[rb] = ra;
      rank[ra]++;
    }
    return true;
  }

  function reset() {
    parent = Array.from({ length: N }, (_, i) => i);
    rank = new Array(N).fill(0);
    log = [];
    currentOp = -1;
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runDemo() {
    reset();
    running = true;
    await sleep(500);

    for (let i = 0; i < unionOps.length && running; i++) {
      const [a, b] = unionOps[i];
      currentOp = i;

      const ra = find(a);
      const rb = find(b);
      if (ra === rb) {
        log = [...log, `Union(${a}, ${b}) — already connected (root=${ra})`];
      } else {
        union(a, b);
        parent = [...parent];
        rank = [...rank];
        log = [...log, `Union(${a}, ${b}) — merged sets`];
      }

      await sleep(1000);
    }

    currentOp = -1;
    running = false;
  }

  $: positions = computePositions();

  // Compute edges (child → parent)
  $: treeEdges = parent
    .map((p, i) => (p !== i ? [i, p] as [number, number] : null))
    .filter((e): e is [number, number] => e !== null);
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runDemo}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Union-Find'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 220" class="w-full max-w-md mx-auto" role="img" aria-label="Union-Find visualization">
    {#each treeEdges as edge}
      {@const p1 = positions[edge[0]]}
      {@const p2 = positions[edge[1]]}
      {#if p1 && p2}
        <line
          x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke="var(--border)" stroke-width="1.5"
          class="transition-all duration-500"
        />
      {/if}
    {/each}

    {#each positions as pos, i}
      {#if pos}
        {@const isActive = currentOp >= 0 && (unionOps[currentOp][0] === i || unionOps[currentOp][1] === i)}
        <circle
          cx={pos.x} cy={pos.y} r="20"
          fill={isActive ? '#3b82f6' : parent[i] === i ? '#22c55e' : 'var(--muted)'}
          stroke="var(--border)" stroke-width="2"
          class="transition-all duration-500"
        />
        <text
          x={pos.x} y={pos.y + 5}
          text-anchor="middle" font-size="13" font-weight="600"
          fill="var(--foreground)"
        >
          {i}
        </text>
      {/if}
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Root</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Active</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Child</span>
  </div>

  {#if currentOp >= 0}
    <div class="text-sm font-mono">
      <p class="text-muted-foreground">
        Operations: {unionOps.map(([a, b], i) => 
          i === currentOp ? `[Union(${a},${b})]` : `Union(${a},${b})`
        ).join(' → ')}
      </p>
    </div>
  {/if}

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
