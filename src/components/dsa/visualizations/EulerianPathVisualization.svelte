<script lang="ts">
  type Step = { stack: number[]; path: number[]; note: string };

  const steps: Step[] = [
    { stack: [0], path: [], note: 'Start Hierholzer from any valid start vertex.' },
    { stack: [0, 1, 2, 0], path: [], note: 'Walk unused edges greedily, pushing vertices onto the stack.' },
    { stack: [0, 1, 2], path: [0], note: 'When a vertex has no unused outgoing edge, pop it into the final path.' },
    { stack: [0, 1], path: [0, 2], note: 'Keep backtracking; dead ends build the path in reverse.' },
    { stack: [], path: [0, 2, 1, 0], note: 'When the stack empties, reversing the built list gives the Eulerian walk.' },
  ];

  let stepIndex = 0;
  $: step = steps[stepIndex];
  function prev() { stepIndex = Math.max(stepIndex - 1, 0); }
  function next() { stepIndex = Math.min(stepIndex + 1, steps.length - 1); }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === steps.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Step {stepIndex + 1} / {steps.length}</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current stack</p>
      <div class="flex flex-wrap gap-3">
        {#each step.stack as node}
          <div class="rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-2 font-semibold">{node}</div>
        {/each}
      </div>
    </div>
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Built path (reverse order)</p>
      <div class="flex flex-wrap gap-3">
        {#each step.path as node}
          <div class="rounded-xl border border-primary bg-primary/10 px-4 py-2 font-semibold">{node}</div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Hierholzer builds the walk backward</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{step.note}</p>
  </div>
</div>
