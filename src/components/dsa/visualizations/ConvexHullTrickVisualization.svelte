<script lang="ts">
  const lines = [
    { name: 'y = x + 1', values: [1, 3, 5, 7] },
    { name: 'y = 2x', values: [0, 4, 8, 12] },
    { name: 'y = -x + 8', values: [8, 6, 4, 2] },
  ];
  const xs = [0, 2, 4, 6];
  let activeX = 4;
  function valueAt(line: { name: string; values: number[] }): number { return line.values[xs.indexOf(activeX)]; }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each xs as x}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${activeX === x ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (activeX = x)}>
        x = {x}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-4">
    {#each lines as line}
      <div class={`rounded-xl border p-4 ${valueAt(line) === Math.min(...lines.map(valueAt)) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
        <p class="font-medium">{line.name}</p>
        <p class="text-sm text-muted-foreground mt-1">value at x = {activeX}: {valueAt(line)}</p>
      </div>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Best line wins each query</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Convex Hull Trick keeps only the lines that can be optimal somewhere. At x = {activeX}, the best value is {Math.min(...lines.map(valueAt))}.</p>
  </div>
</div>
