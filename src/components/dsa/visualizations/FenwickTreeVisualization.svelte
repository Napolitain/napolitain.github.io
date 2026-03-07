<script lang="ts">
  import { onMount } from 'svelte';

  const baseValues = [3, 1, 4, 2, 5, 1, 2, 3];

  let values: number[] = [];
  let bit: number[] = [];
  let highlighted: number[] = [];
  let activeIndex: number | null = null;
  let mode: 'idle' | 'query' | 'update' = 'idle';
  let running = false;
  let log: string[] = [];

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function buildFenwick(arr: number[]): number[] {
    const tree = Array(arr.length + 1).fill(0);
    for (let i = 1; i <= arr.length; i++) {
      let idx = i;
      while (idx <= arr.length) {
        tree[idx] += arr[i - 1];
        idx += idx & -idx;
      }
    }
    return tree;
  }

  function reset() {
    values = [...baseValues];
    bit = buildFenwick(values);
    highlighted = [];
    activeIndex = null;
    mode = 'idle';
    running = false;
    log = ['bit[i] stores the sum of a chunk ending at i, whose size is lowbit(i).'];
  }

  onMount(reset);

  function coverageLabel(index: number): string {
    const start = index - (index & -index) + 1;
    return `[${start}, ${index}]`;
  }

  async function runPrefixQuery() {
    if (running) {
      return;
    }

    reset();
    running = true;
    mode = 'query';
    let idx = 6;
    let sum = 0;
    log = ['prefixSum(6) jumps backward through disjoint ranges.'];

    while (idx > 0) {
      activeIndex = idx;
      highlighted = [...highlighted, idx];
      sum += bit[idx];
      log = [...log, `Use bit[${idx}] covering ${coverageLabel(idx)} => +${bit[idx]} (sum = ${sum})`];
      await sleep(650);
      idx -= idx & -idx;
    }

    activeIndex = null;
    log = [...log, `Answer: prefix sum through index 6 is ${sum}.`];
    running = false;
    mode = 'idle';
  }

  async function runUpdate() {
    if (running) {
      return;
    }

    reset();
    running = true;
    mode = 'update';
    const target = 5;
    const delta = 2;
    values[target - 1] += delta;
    log = [`Add ${delta} at index ${target}, then walk upward through every chunk that covers it.`];

    let idx = target;
    while (idx <= values.length) {
      activeIndex = idx;
      highlighted = [...highlighted, idx];
      bit[idx] += delta;
      log = [...log, `Update bit[${idx}] because it covers ${coverageLabel(idx)}.`];
      await sleep(650);
      idx += idx & -idx;
    }

    activeIndex = null;
    log = [...log, `Done. The updated array value is now ${values[target - 1]}.`];
    running = false;
    mode = 'idle';
  }

  function bitColor(index: number): string {
    if (activeIndex === index) {
      return '#3b82f6';
    }
    if (highlighted.includes(index)) {
      return mode === 'update' ? '#22c55e' : '#93c5fd';
    }
    return 'var(--muted)';
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={runPrefixQuery} disabled={running}>
      Run prefix query
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={runUpdate} disabled={running}>
      Run point update
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={reset} disabled={running}>
      Reset
    </button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Base array (1-indexed)</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {#each values as value, index}
          <div class="rounded-xl border border-border bg-secondary/30 p-3 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">idx {index + 1}</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Fenwick array</p>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {#each bit.slice(1) as value, offset}
          {@const index = offset + 1}
          <div
            class="rounded-xl border p-3 text-center transition-colors"
            style={`background:${bitColor(index)}; border-color: var(--border);`}
          >
            <p class="text-[11px] text-muted-foreground mb-1">bit[{index}]</p>
            <p class="font-semibold">{value}</p>
            <p class="text-[11px] text-muted-foreground mt-1">covers {coverageLabel(index)}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Why Fenwick trees are useful</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Prefix queries walk backward by removing the least-significant set bit. Updates walk forward by adding that same bit. That symmetry is the whole data structure.
    </p>
  </div>

  <div class="text-sm font-mono space-y-0.5 max-h-44 overflow-y-auto">
    {#each log as entry}
      <p class="text-muted-foreground">{entry}</p>
    {/each}
  </div>
</div>
