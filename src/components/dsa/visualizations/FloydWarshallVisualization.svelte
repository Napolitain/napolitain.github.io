<script lang="ts">
  type Cell = number | 'inf';
  type State = {
    k: number;
    row0: Cell[];
    row1: Cell[];
    note: string;
  };

  const inf: Cell = 'inf';
  const states: State[] = [
    { k: -1, row0: [0, 3, 10, inf], row1: [inf, 0, 1, 7], note: 'Initial matrix: direct edges only.' },
    { k: 1, row0: [0, 3, 4, 10], row1: [inf, 0, 1, 7], note: 'Using node 1 as an intermediate improves 0 -> 2 to 4.' },
    { k: 2, row0: [0, 3, 4, 8], row1: [inf, 0, 1, 5], note: 'Using node 2 as an intermediate improves 0 -> 3 and 1 -> 3.' },
  ];

  let stepIndex = 0;
  $: state = states[stepIndex];

  function prev() { stepIndex = Math.max(stepIndex - 1, 0); }
  function next() { stepIndex = Math.min(stepIndex + 1, states.length - 1); }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === states.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">{state.k === -1 ? 'initial matrix' : `allowing intermediate ${state.k}`}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th class="text-left p-3 border-b border-border">from \\ to</th>
            <th class="text-left p-3 border-b border-border">0</th>
            <th class="text-left p-3 border-b border-border">1</th>
            <th class="text-left p-3 border-b border-border">2</th>
            <th class="text-left p-3 border-b border-border">3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="p-3 border-b border-border font-medium">0</td>
            {#each state.row0 as value}
              <td class="p-3 border-b border-border">{value}</td>
            {/each}
          </tr>
          <tr>
            <td class="p-3 border-b border-border font-medium">1</td>
            {#each state.row1 as value}
              <td class="p-3 border-b border-border">{value}</td>
            {/each}
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Dynamic programming over intermediates</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{state.note}</p>
  </div>
</div>
