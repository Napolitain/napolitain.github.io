<script lang="ts">
  import { onMount } from 'svelte';

  let heap: number[] = [];
  let highlightIdx = -1;
  let swapPair: [number, number] | null = null;
  let running = false;
  let log: string[] = [];

  const insertValues = [42, 15, 28, 7, 35, 3, 19];

  function reset() {
    heap = [];
    highlightIdx = -1;
    swapPair = null;
    running = false;
    log = [];
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function parent(i: number) { return Math.floor((i - 1) / 2); }
  function leftChild(i: number) { return 2 * i + 1; }
  function rightChild(i: number) { return 2 * i + 2; }

  // Tree positions for up to 15 nodes
  function nodePos(i: number): { x: number; y: number } {
    const depth = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, depth) - 1);
    const levelCount = Math.pow(2, depth);
    const spacing = 360 / levelCount;
    return {
      x: 20 + spacing * posInLevel + spacing / 2,
      y: 40 + depth * 70,
    };
  }

  async function runInserts() {
    reset();
    running = true;

    for (const val of insertValues) {
      if (!running) break;

      // Insert at end
      heap = [...heap, val];
      highlightIdx = heap.length - 1;
      log = [...log, `Insert ${val}`];
      await sleep(500);

      // Bubble up
      let i = heap.length - 1;
      while (i > 0 && running) {
        const p = parent(i);
        if (heap[i] < heap[p]) {
          swapPair = [i, p];
          log = [...log, `  Swap ${heap[i]} ↔ ${heap[p]}`];
          await sleep(500);

          [heap[i], heap[p]] = [heap[p], heap[i]];
          heap = [...heap];
          swapPair = null;
          i = p;
          highlightIdx = i;
          await sleep(300);
        } else {
          break;
        }
      }

      highlightIdx = -1;
      await sleep(300);
    }

    log = [...log, `Min-heap built: [${heap.join(', ')}]`];
    running = false;
  }

  async function runExtract() {
    if (heap.length === 0) return;
    running = true;

    const min = heap[0];
    log = [...log, `Extract min: ${min}`];
    highlightIdx = 0;
    await sleep(500);

    // Move last to root
    heap[0] = heap[heap.length - 1];
    heap = heap.slice(0, -1);
    heap = [...heap];
    await sleep(400);

    // Bubble down
    let i = 0;
    while (running) {
      const l = leftChild(i);
      const r = rightChild(i);
      let smallest = i;

      if (l < heap.length && heap[l] < heap[smallest]) smallest = l;
      if (r < heap.length && heap[r] < heap[smallest]) smallest = r;

      if (smallest === i) break;

      swapPair = [i, smallest];
      log = [...log, `  Swap ${heap[i]} ↔ ${heap[smallest]}`];
      await sleep(500);

      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      heap = [...heap];
      swapPair = null;
      i = smallest;
      highlightIdx = i;
      await sleep(300);
    }

    highlightIdx = -1;
    log = [...log, `Extracted ${min}. Heap: [${heap.join(', ')}]`];
    running = false;
  }

  function nodeColor(i: number): string {
    if (swapPair && (i === swapPair[0] || i === swapPair[1])) return '#ef4444';
    if (i === highlightIdx) return '#3b82f6';
    return '#22c55e';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runInserts}
      disabled={running}
    >
      {running ? 'Running...' : 'Build Heap'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runExtract}
      disabled={running || heap.length === 0}
    >
      Extract Min
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 260" class="w-full max-w-md mx-auto" role="img" aria-label="Heap visualization">
    <!-- Edges (parent to children) -->
    {#each heap as _, i}
      {#if i > 0}
        {@const p = parent(i)}
        {@const pPos = nodePos(p)}
        {@const cPos = nodePos(i)}
        <line
          x1={pPos.x} y1={pPos.y} x2={cPos.x} y2={cPos.y}
          stroke="var(--border)" stroke-width="1.5"
        />
      {/if}
    {/each}

    <!-- Nodes -->
    {#each heap as val, i}
      {@const pos = nodePos(i)}
      <circle
        cx={pos.x} cy={pos.y} r="20"
        fill={nodeColor(i)}
        stroke="var(--border)" stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={pos.x} y={pos.y + 5}
        text-anchor="middle" font-size="13" font-weight="600"
        fill="var(--foreground)"
      >
        {val}
      </text>
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Heap node</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Active</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span> Swapping</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-48 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
