<script lang="ts">
  import { onMount } from 'svelte';

  // Fibonacci visualization with memoization
  let n = 8;
  let dpTable: (number | null)[] = [];
  let computing = -1;
  let running = false;
  let log: string[] = [];
  let callCount = 0;
  let speed = 500;

  function reset() {
    dpTable = new Array(n + 1).fill(null);
    computing = -1;
    running = false;
    log = [];
    callCount = 0;
  }

  onMount(reset);

  function randomize() {
    n = 5 + Math.floor(Math.random() * 6);
    reset();
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runDP() {
    reset();
    running = true;

    dpTable[0] = 0;
    dpTable[1] = 1;
    dpTable = [...dpTable];
    log = ['Base cases: dp[0]=0, dp[1]=1'];
    await sleep(speed);

    for (let i = 2; i <= n && running; i++) {
      computing = i;
      callCount++;
      log = [...log, `Computing dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dpTable[i - 1]} + ${dpTable[i - 2]}`];
      await sleep(speed);

      dpTable[i] = (dpTable[i - 1] ?? 0) + (dpTable[i - 2] ?? 0);
      dpTable = [...dpTable];
      await sleep(speed);
    }

    computing = -1;
    log = [...log, `Done! fib(${n}) = ${dpTable[n]}. Only ${n - 1} computations (vs ${fibNaiveCalls(n)} naive recursive calls).`];
    running = false;
  }

  function fibNaiveCalls(x: number): number {
    if (x <= 1) return 1;
    return 1 + fibNaiveCalls(x - 1) + fibNaiveCalls(x - 2);
  }

  function cellColor(i: number): string {
    if (i === computing) return '#3b82f6';
    if (dpTable[i] !== null) return '#22c55e';
    return 'var(--muted)';
  }

  const cellW = 40;
  const gap = 4;
  $: totalW = (n + 1) * (cellW + gap) - gap;
  $: offsetX = Math.max((420 - totalW) / 2, 5);
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runDP}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Fibonacci DP'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={randomize}
      disabled={running}
    >
      Randomize
    </button>
    <label class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">Speed:</span>
      <input type="range" min="100" max="1500" step="100" bind:value={speed} class="w-24" disabled={running} />
    </label>
    <label class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">n:</span>
      <select bind:value={n} on:change={reset} class="rounded border border-border bg-background px-2 py-1 text-sm" disabled={running}>
        {#each [5, 6, 7, 8, 9, 10] as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </label>
  </div>

  <svg viewBox="0 0 420 100" class="w-full max-w-lg mx-auto" role="img" aria-label="DP table visualization">
    {#each dpTable as val, i}
      {@const x = offsetX + i * (cellW + gap)}
      <!-- Index label -->
      <text
        x={x + cellW / 2} y="15"
        text-anchor="middle" font-size="10"
        fill="var(--muted-foreground)"
      >
        {i}
      </text>

      <rect
        x={x} y="22" width={cellW} height="36" rx="4"
        fill={cellColor(i)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={x + cellW / 2} y="45"
        text-anchor="middle" font-size="12" font-weight="600"
        fill="var(--foreground)"
      >
        {val !== null ? val : '—'}
      </text>

      <!-- Arrow from i-1 and i-2 -->
      {#if i === computing && i >= 2}
        <line
          x1={x - gap} y1="40"
          x2={x - gap - cellW + 5} y2="40"
          stroke="#3b82f6" stroke-width="1" stroke-dasharray="3"
        />
        {#if i >= 3}
          <line
            x1={x - gap} y1="45"
            x2={x - gap - 2 * cellW - gap + 5} y2="45"
            stroke="#3b82f6" stroke-width="1" stroke-dasharray="3"
          />
        {/if}
      {/if}
    {/each}

    <!-- dp[] label -->
    <text x={offsetX - 5} y="45" text-anchor="end" font-size="11" fill="var(--muted-foreground)">dp</text>
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Computed</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Computing</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[var(--muted)] border border-border"></span> Not yet</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
