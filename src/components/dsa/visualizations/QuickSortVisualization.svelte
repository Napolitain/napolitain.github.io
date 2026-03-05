<script lang="ts">
  import { onMount } from 'svelte';

  let arr: number[] = [];
  let pivotIdx = -1;
  let comparing: [number, number] | null = null;
  let sorted: Set<number> = new Set();
  let running = false;
  let log: string[] = [];

  const initial = [38, 27, 43, 3, 9, 82, 10];

  function reset() {
    arr = [...initial];
    pivotIdx = -1;
    comparing = null;
    sorted = new Set();
    running = false;
    log = [];
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function partition(lo: number, hi: number): Promise<number> {
    const pivot = arr[hi];
    pivotIdx = hi;
    log = [...log, `Pivot = ${pivot} (index ${hi})`];
    await sleep(400);

    let i = lo - 1;

    for (let j = lo; j < hi && running; j++) {
      comparing = [j, hi];
      await sleep(300);

      if (arr[j] <= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        arr = [...arr];
        await sleep(200);
      }
      comparing = null;
    }

    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    arr = [...arr];
    sorted.add(i + 1);
    sorted = new Set(sorted);
    pivotIdx = -1;
    log = [...log, `Pivot ${pivot} placed at index ${i + 1}`];
    await sleep(400);

    return i + 1;
  }

  async function quickSort(lo: number, hi: number) {
    if (lo >= hi || !running) {
      if (lo === hi) {
        sorted.add(lo);
        sorted = new Set(sorted);
      }
      return;
    }

    const p = await partition(lo, hi);
    await quickSort(lo, p - 1);
    await quickSort(p + 1, hi);
  }

  async function run() {
    reset();
    running = true;
    await quickSort(0, arr.length - 1);
    sorted = new Set(arr.map((_, i) => i));
    log = [...log, `Sorted: [${arr.join(', ')}]`];
    running = false;
  }

  function cellColor(i: number): string {
    if (sorted.has(i)) return '#22c55e';
    if (i === pivotIdx) return '#ef4444';
    if (comparing && (i === comparing[0] || i === comparing[1])) return '#3b82f6';
    return 'var(--muted)';
  }

  const cellW = 44;
  const gap = 4;
  $: totalW = arr.length * (cellW + gap) - gap;
  $: offsetX = (400 - totalW) / 2;
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={run}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Quick Sort'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 80" class="w-full max-w-lg mx-auto" role="img" aria-label="Quick sort visualization">
    {#each arr as val, i}
      {@const x = offsetX + i * (cellW + gap)}
      <rect
        x={x} y="15" width={cellW} height="38" rx="4"
        fill={cellColor(i)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={x + cellW / 2} y="39"
        text-anchor="middle" font-size="13" font-weight="600"
        fill="var(--foreground)"
      >
        {val}
      </text>
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500"></span> Pivot</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Comparing</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Sorted</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-48 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
