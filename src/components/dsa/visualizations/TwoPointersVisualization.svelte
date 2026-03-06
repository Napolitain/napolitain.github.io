<script lang="ts">
  import { onMount } from 'svelte';

  // Two-sum on sorted array
  let arr = [2, 7, 11, 15, 19, 23, 28, 34];
  let target = 30;
  let speed = 500;

  let left = -1;
  let right = -1;
  let found: [number, number] | null = null;
  let running = false;
  let log: string[] = [];

  function reset() {
    left = -1;
    right = -1;
    found = null;
    running = false;
    log = [];
  }

  onMount(reset);

  function randomize() {
    const len = 6 + Math.floor(Math.random() * 4);
    const nums = new Set<number>();
    while (nums.size < len) nums.add(Math.floor(Math.random() * 50) + 1);
    arr = [...nums].sort((a, b) => a - b);
    const i = Math.floor(Math.random() * arr.length);
    let j = Math.floor(Math.random() * arr.length);
    while (j === i) j = Math.floor(Math.random() * arr.length);
    target = arr[i] + arr[j];
    reset();
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runTwoPointers() {
    reset();
    running = true;
    left = 0;
    right = arr.length - 1;
    log = [`Finding two numbers that sum to ${target}`];

    await sleep(speed);

    while (left < right && running) {
      const sum = arr[left] + arr[right];
      log = [...log, `arr[${left}]+arr[${right}] = ${arr[left]}+${arr[right]} = ${sum}`];
      await sleep(speed);

      if (sum === target) {
        found = [left, right];
        log = [...log, `Found! Indices ${left} and ${right}`];
        break;
      } else if (sum < target) {
        log = [...log, `${sum} < ${target} → move left pointer right`];
        left++;
      } else {
        log = [...log, `${sum} > ${target} → move right pointer left`];
        right--;
      }
      await sleep(speed);
    }

    if (!found && running) {
      log = [...log, `No pair found that sums to ${target}`];
    }
    running = false;
  }

  function cellColor(i: number): string {
    if (found && (i === found[0] || i === found[1])) return '#22c55e';
    if (i === left) return '#3b82f6';
    if (i === right) return '#ef4444';
    if (i > left && i < right && left >= 0) return '#facc1540';
    return 'var(--muted)';
  }

  const cellW = 40;
  const gap = 4;
  $: totalW = arr.length * (cellW + gap) - gap;
  $: offsetX = (420 - totalW) / 2;
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runTwoPointers}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Two Pointers'}
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
      <span class="text-muted-foreground">Target:</span>
      <select bind:value={target} class="rounded border border-border bg-background px-2 py-1 text-sm" disabled={running}>
        <option value={9}>9</option>
        <option value={30}>30</option>
        <option value={26}>26</option>
        <option value={42}>42</option>
        <option value={100}>100 (not found)</option>
      </select>
    </label>
  </div>

  <svg viewBox="0 0 420 100" class="w-full max-w-lg mx-auto" role="img" aria-label="Two pointers visualization">
    {#each arr as val, i}
      {@const x = offsetX + i * (cellW + gap)}
      <rect
        x={x} y="25" width={cellW} height="38" rx="4"
        fill={cellColor(i)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={x + cellW / 2} y="49"
        text-anchor="middle" font-size="12" font-weight="600"
        fill="var(--foreground)"
      >
        {val}
      </text>

      {#if left === i}
        <text x={x + cellW / 2} y="18" text-anchor="middle" font-size="10" font-weight="600" fill="#3b82f6">L</text>
      {/if}
      {#if right === i}
        <text x={x + cellW / 2} y="18" text-anchor="middle" font-size="10" font-weight="600" fill="#ef4444">R</text>
      {/if}
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Left</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500"></span> Right</span>
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
