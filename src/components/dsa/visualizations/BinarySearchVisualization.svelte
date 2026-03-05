<script lang="ts">
  import { onMount } from 'svelte';

  const initialArray = [2, 5, 8, 12, 16, 23, 38, 42, 56, 72, 91];
  let arr = [...initialArray];
  let target = 23;

  let lo = -1;
  let hi = -1;
  let mid = -1;
  let found = -1;
  let running = false;
  let log: string[] = [];

  function reset() {
    arr = [...initialArray];
    lo = -1;
    hi = -1;
    mid = -1;
    found = -1;
    running = false;
    log = [];
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runSearch() {
    reset();
    running = true;

    lo = 0;
    hi = arr.length - 1;
    found = -1;
    log = [`Searching for ${target} in [${arr.join(', ')}]`];

    await sleep(600);

    while (lo <= hi && running) {
      mid = lo + Math.floor((hi - lo) / 2);
      log = [...log, `lo=${lo}, hi=${hi}, mid=${mid} → arr[${mid}]=${arr[mid]}`];
      await sleep(800);

      if (arr[mid] === target) {
        found = mid;
        log = [...log, `Found ${target} at index ${mid}!`];
        break;
      } else if (arr[mid] < target) {
        log = [...log, `${arr[mid]} < ${target} → search right half`];
        lo = mid + 1;
      } else {
        log = [...log, `${arr[mid]} > ${target} → search left half`];
        hi = mid - 1;
      }

      mid = -1;
      await sleep(500);
    }

    if (found === -1 && running) {
      log = [...log, `${target} not found in array`];
    }

    running = false;
  }

  function cellColor(i: number): string {
    if (found === i) return '#22c55e';
    if (mid === i) return '#3b82f6';
    if (i >= lo && i <= hi && lo >= 0) return '#facc1580';
    return 'var(--muted)';
  }

  const cellW = 34;
  const gap = 3;
  $: totalW = arr.length * (cellW + gap) - gap;
  $: offsetX = (400 - totalW) / 2;
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runSearch}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Binary Search'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
    <label class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">Target:</span>
      <select bind:value={target} class="rounded border border-border bg-background px-2 py-1 text-sm" disabled={running}>
        {#each arr as val}
          <option value={val}>{val}</option>
        {/each}
        <option value={99}>99 (not found)</option>
      </select>
    </label>
  </div>

  <svg viewBox="0 0 400 120" class="w-full max-w-lg mx-auto" role="img" aria-label="Binary search visualization">
    {#each arr as val, i}
      {@const x = offsetX + i * (cellW + gap)}
      <rect
        x={x} y="30" width={cellW} height={cellW}
        rx="4"
        fill={cellColor(i)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={x + cellW / 2} y="52"
        text-anchor="middle" font-size="11" font-weight="600"
        fill="var(--foreground)"
      >
        {val}
      </text>
      <text
        x={x + cellW / 2} y="80"
        text-anchor="middle" font-size="9"
        fill="var(--muted-foreground)"
      >
        {i}
      </text>

      <!-- Markers -->
      {#if lo === i}
        <text x={x + cellW / 2} y="25" text-anchor="middle" font-size="10" font-weight="600" fill="#3b82f6">lo</text>
      {/if}
      {#if hi === i}
        <text x={x + cellW / 2} y="25" text-anchor="middle" font-size="10" font-weight="600" fill="#ef4444">hi</text>
      {/if}
      {#if mid === i}
        <text x={x + cellW / 2} y="100" text-anchor="middle" font-size="10" font-weight="600" fill="#3b82f6">mid</text>
      {/if}
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-yellow-400/50 border border-border"></span> Search range</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Mid</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Found</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
