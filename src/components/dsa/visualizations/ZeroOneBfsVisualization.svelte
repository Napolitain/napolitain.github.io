<script lang="ts">
  type Step = {
    current: number | null;
    deque: number[];
    distances: number[];
    note: string;
    relaxed?: { to: number; weight: 0 | 1 };
  };

  const steps: Step[] = [
    { current: 0, deque: [0], distances: [0, Infinity, Infinity, Infinity, Infinity, Infinity], note: 'Start from node 0 with distance 0.' },
    { current: 0, deque: [1, 2], distances: [0, 0, 1, Infinity, Infinity, Infinity], note: 'Relax 0-weight edge to 1 at the front and 1-weight edge to 2 at the back.', relaxed: { to: 1, weight: 0 } },
    { current: 1, deque: [2, 3], distances: [0, 0, 1, 1, Infinity, Infinity], note: 'Pop 1. Its 1-weight edge to 3 goes to the back.', relaxed: { to: 3, weight: 1 } },
    { current: 2, deque: [3, 4], distances: [0, 0, 1, 1, 2, Infinity], note: 'Pop 2. A 1-weight edge to 4 also goes to the back.', relaxed: { to: 4, weight: 1 } },
    { current: 3, deque: [5, 4], distances: [0, 0, 1, 1, 2, 1], note: 'Pop 3. Its 0-weight edge to 5 jumps to the front, beating waiting 1-weight work.', relaxed: { to: 5, weight: 0 } },
    { current: 5, deque: [4], distances: [0, 0, 1, 1, 2, 1], note: 'Pop 5. No better relaxations remain.' },
  ];

  const edges = [
    { from: 0, to: 1, weight: 0 },
    { from: 0, to: 2, weight: 1 },
    { from: 1, to: 3, weight: 1 },
    { from: 2, to: 4, weight: 1 },
    { from: 3, to: 5, weight: 0 },
    { from: 4, to: 5, weight: 1 },
  ];

  let stepIndex = 0;
  $: step = steps[stepIndex];

  function next() {
    stepIndex = Math.min(stepIndex + 1, steps.length - 1);
  }

  function prev() {
    stepIndex = Math.max(stepIndex - 1, 0);
  }

  function nodeColor(node: number): string {
    if (step.current === node) return 'border-primary bg-primary/10';
    if (step.deque.includes(node)) return 'border-amber-400 bg-amber-500/10';
    if (Number.isFinite(step.distances[node])) return 'border-emerald-400 bg-emerald-500/10';
    return 'border-border bg-secondary/30';
  }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === steps.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Step {stepIndex + 1} / {steps.length}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Edges</p>
      <div class="grid gap-2 sm:grid-cols-2">
        {#each edges as edge}
          <div class={`rounded-lg border p-3 text-sm ${step.relaxed?.to === edge.to ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            {edge.from} -> {edge.to} (weight {edge.weight})
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Deque state</p>
      <div class="flex flex-wrap gap-3 items-center">
        <span class="text-xs text-muted-foreground">front</span>
        {#each step.deque as node}
          <div class="rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-2 font-semibold">{node}</div>
        {/each}
        <span class="text-xs text-muted-foreground">back</span>
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Distances</p>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {#each step.distances as distance, node}
          <div class={`rounded-xl border p-3 text-center ${nodeColor(node)}`}>
            <p class="text-[11px] text-muted-foreground mb-1">node {node}</p>
            <p class="font-semibold">{Number.isFinite(distance) ? distance : 'inf'}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Deque instead of heap</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{step.note}</p>
  </div>
</div>
