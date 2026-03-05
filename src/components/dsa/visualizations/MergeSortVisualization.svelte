<script lang="ts">
  import { onMount } from 'svelte';

  let arr: number[] = [];
  let highlights: { indices: number[]; color: string; label?: string }[] = [];
  let running = false;
  let log: string[] = [];

  const initial = [38, 27, 43, 3, 9, 82, 10];

  function reset() {
    arr = [...initial];
    highlights = [];
    log = [];
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function mergeSort(a: number[], offset: number): Promise<number[]> {
    if (a.length <= 1) return a;
    if (!running) return a;

    const mid = Math.floor(a.length / 2);
    const leftIdx = Array.from({ length: mid }, (_, i) => offset + i);
    const rightIdx = Array.from({ length: a.length - mid }, (_, i) => offset + mid + i);

    highlights = [
      { indices: leftIdx, color: '#3b82f6', label: 'left' },
      { indices: rightIdx, color: '#a855f7', label: 'right' },
    ];
    log = [...log, `Split [${a.join(', ')}] at index ${mid}`];
    await sleep(500);

    const left = await mergeSort(a.slice(0, mid), offset);
    const right = await mergeSort(a.slice(mid), offset + mid);

    if (!running) return [...left, ...right];

    // Merge
    const merged: number[] = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        merged.push(left[i++]);
      } else {
        merged.push(right[j++]);
      }
    }
    while (i < left.length) merged.push(left[i++]);
    while (j < right.length) merged.push(right[j++]);

    // Update the main array
    for (let k = 0; k < merged.length; k++) {
      arr[offset + k] = merged[k];
    }
    arr = [...arr];

    highlights = [{ indices: Array.from({ length: merged.length }, (_, k) => offset + k), color: '#22c55e' }];
    log = [...log, `Merged → [${merged.join(', ')}]`];
    await sleep(600);

    return merged;
  }

  async function run() {
    reset();
    running = true;
    await mergeSort([...arr], 0);
    highlights = [{ indices: arr.map((_, i) => i), color: '#22c55e' }];
    log = [...log, `Sorted: [${arr.join(', ')}]`];
    running = false;
  }

  function cellColor(i: number): string {
    for (const h of highlights) {
      if (h.indices.includes(i)) return h.color;
    }
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
      {running ? 'Running...' : 'Run Merge Sort'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 80" class="w-full max-w-lg mx-auto" role="img" aria-label="Merge sort visualization">
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
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Left half</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-purple-500"></span> Right half</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Merged</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-48 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
