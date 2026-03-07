<script lang="ts">
  const intervals = [
    { node: '[0, 3]', best: 'y = x + 1' },
    { node: '[4, 7]', best: 'y = -x + 8' },
    { node: '[0, 7]', best: 'y = 2x' },
  ];
  let active = intervals[2];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each intervals as interval}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.node === interval.node ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = interval)}>
        {interval.node}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-4">
    {#each intervals as interval}
      <div class={`rounded-xl border p-4 ${active.node === interval.node ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
        <p class="font-medium">interval {interval.node}</p>
        <p class="text-sm text-muted-foreground mt-1">stored best line candidate: {interval.best}</p>
      </div>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Segment tree over x-domain</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">A Li Chao tree stores line candidates by x-interval. At each node, the line that wins at the midpoint stays, and the losing line is pushed to the side where it might still become optimal.</p>
  </div>
</div>
