<script lang="ts">
  type Step = {
    node: number;
    stack: number[];
    low: number[];
    disc: number[];
    note: string;
    component?: number[];
  };

  const steps: Step[] = [
    { node: 0, stack: [0], disc: [0, -1, -1, -1, -1, -1], low: [0, -1, -1, -1, -1, -1], note: 'Start DFS at 0 and push it onto the stack.' },
    { node: 2, stack: [0, 1, 2], disc: [0, 1, 2, -1, -1, -1], low: [0, 1, 0, -1, -1, -1], note: '0 -> 1 -> 2 forms a back edge to 0, so low[2] drops to 0.' },
    { node: 4, stack: [0, 1, 2, 3, 4], disc: [0, 1, 2, 3, 4, -1], low: [0, 1, 0, 3, 3, -1], note: '3 -> 4 -> 3 becomes another SCC candidate with low-link 3.' },
    { node: 5, stack: [0, 1, 2, 3, 4, 5], disc: [0, 1, 2, 3, 4, 5], low: [0, 1, 0, 3, 3, 5], note: 'Node 5 has no back edge, so it will pop alone as an SCC.', component: [5] },
    { node: 3, stack: [0, 1, 2], disc: [0, 1, 2, 3, 4, 5], low: [0, 1, 0, 3, 3, 5], note: 'Now low[3] == disc[3], so {3, 4} pops as one SCC.', component: [4, 3] },
    { node: 0, stack: [], disc: [0, 1, 2, 3, 4, 5], low: [0, 1, 0, 3, 3, 5], note: 'Finally, low[0] == disc[0], so {0, 1, 2} pops together.', component: [2, 1, 0] },
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

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th class="text-left p-3 border-b border-border">node</th>
            <th class="text-left p-3 border-b border-border">disc</th>
            <th class="text-left p-3 border-b border-border">low</th>
          </tr>
        </thead>
        <tbody>
          {#each step.disc as disc, node}
            <tr class={node === step.node ? 'bg-primary/5' : ''}>
              <td class="p-3 border-b border-border font-medium">{node}</td>
              <td class="p-3 border-b border-border">{disc === -1 ? '-' : disc}</td>
              <td class="p-3 border-b border-border">{step.low[node] === -1 ? '-' : step.low[node]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Tarjan stack</p>
      <div class="flex flex-wrap gap-3">
        {#each step.stack as node}
          <div class="rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-2 font-semibold">{node}</div>
        {/each}
      </div>
    </div>

    {#if step.component}
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Component popped now</p>
        <div class="flex flex-wrap gap-3">
          {#each step.component as node}
            <div class="rounded-xl border border-primary bg-primary/10 px-4 py-2 font-semibold">{node}</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Low-link values decide SCC roots</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{step.note}</p>
  </div>
</div>
