<script lang="ts">
  import { onMount } from 'svelte';

  interface LLNode {
    val: number;
    id: number;
  }

  let nodes: LLNode[] = [];
  let pointers: Record<string, number> = {}; // name → node index
  let running = false;
  let log: string[] = [];
  let mode: 'reverse' | 'cycle' = 'reverse';

  const initialValues = [1, 2, 3, 4, 5];
  let nextId = 0;

  function makeList(vals: number[]): LLNode[] {
    return vals.map(v => ({ val: v, id: nextId++ }));
  }

  function reset() {
    nextId = 0;
    nodes = makeList(initialValues);
    pointers = {};
    log = [];
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runReverse() {
    reset();
    mode = 'reverse';
    running = true;
    log = ['Reversing linked list...'];

    let prev = -1;
    let curr = 0;
    pointers = { prev: -1, curr: 0 };
    await sleep(600);

    while (curr < nodes.length && running) {
      const next = curr + 1;
      pointers = { prev, curr, next: next < nodes.length ? next : -1 };
      log = [...log, `curr=${nodes[curr].val}, reverse pointer`];
      await sleep(700);

      curr++;
      prev++;
      await sleep(300);
    }

    // Show reversed
    nodes = [...nodes].reverse();
    pointers = {};
    log = [...log, `Reversed: [${nodes.map(n => n.val).join(' → ')}]`];
    running = false;
  }

  async function runFloyd() {
    reset();
    mode = 'cycle';
    running = true;

    // Add a "cycle" indicator
    log = ['Floyd cycle detection (no cycle in this list)...'];

    let slow = 0;
    let fast = 0;
    pointers = { slow: 0, fast: 0 };
    await sleep(600);

    while (fast < nodes.length - 1 && running) {
      slow++;
      fast = Math.min(fast + 2, nodes.length);
      pointers = { slow: Math.min(slow, nodes.length - 1), fast: Math.min(fast, nodes.length - 1) };
      log = [...log, `slow→${slow < nodes.length ? nodes[slow]?.val : 'end'}, fast→${fast < nodes.length ? nodes[fast]?.val : 'end'}`];
      await sleep(600);
    }

    log = [...log, 'Fast reached end — no cycle detected'];
    pointers = {};
    running = false;
  }

  function nodeColor(i: number): string {
    if (pointers.curr === i) return '#3b82f6';
    if (pointers.slow === i && pointers.fast === i) return '#ef4444';
    if (pointers.slow === i) return '#22c55e';
    if (pointers.fast === i) return '#a855f7';
    if (pointers.prev === i) return '#facc15';
    return 'var(--muted)';
  }

  const nodeW = 50;
  const arrowW = 30;
  $: totalW = nodes.length * nodeW + (nodes.length - 1) * arrowW;
  $: offsetX = Math.max((440 - totalW) / 2, 10);
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runReverse}
      disabled={running}
    >
      {running && mode === 'reverse' ? 'Running...' : 'Reverse List'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runFloyd}
      disabled={running}
    >
      {running && mode === 'cycle' ? 'Running...' : 'Floyd Cycle Detection'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 440 80" class="w-full max-w-lg mx-auto" role="img" aria-label="Linked list visualization">
    {#each nodes as node, i}
      {@const x = offsetX + i * (nodeW + arrowW)}
      <!-- Node box -->
      <rect
        x={x} y="20" width={nodeW} height="36" rx="6"
        fill={nodeColor(i)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={x + nodeW / 2} y="43"
        text-anchor="middle" font-size="14" font-weight="600"
        fill="var(--foreground)"
      >
        {node.val}
      </text>

      <!-- Arrow to next -->
      {#if i < nodes.length - 1}
        <line
          x1={x + nodeW} y1="38"
          x2={x + nodeW + arrowW - 6} y2="38"
          stroke="var(--border)" stroke-width="1.5"
        />
        <polygon
          points="{x + nodeW + arrowW - 6},{38} {x + nodeW + arrowW - 12},{34} {x + nodeW + arrowW - 12},{42}"
          fill="var(--border)"
        />
      {/if}

      <!-- Pointer labels -->
      {#each Object.entries(pointers) as [name, idx]}
        {#if idx === i}
          <text
            x={x + nodeW / 2} y="14"
            text-anchor="middle" font-size="10" font-weight="600"
            fill={name === 'slow' ? '#22c55e' : name === 'fast' ? '#a855f7' : name === 'curr' ? '#3b82f6' : '#facc15'}
          >
            {name}
          </text>
        {/if}
      {/each}
    {/each}

    <!-- null terminator -->
    <text
      x={offsetX + nodes.length * (nodeW + arrowW) - arrowW / 2} y="43"
      text-anchor="middle" font-size="11" fill="var(--muted-foreground)"
    >
      null
    </text>
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    {#if mode === 'reverse'}
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-yellow-400"></span> prev</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> curr</span>
    {:else}
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> slow</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-purple-500"></span> fast</span>
    {/if}
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
