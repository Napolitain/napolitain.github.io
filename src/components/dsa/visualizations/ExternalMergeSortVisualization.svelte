<script lang="ts">
  const phases = [
    { label: 'run generation', items: ['read chunk', 'sort in RAM', 'write run'] },
    { label: 'k-way merge', items: ['heap over run heads', 'emit smallest', 'refill from that run'] },
  ];
  let active = phases[1];
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    {#each phases as phase}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.label === phase.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = phase)}>
        {phase.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5">
    <div class="flex flex-wrap gap-3 items-center">
      {#each active.items as item, index}
        <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">{item}</div>
        {#if index < active.items.length - 1}
          <span class="text-muted-foreground">-></span>
        {/if}
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Sort more data than fits in memory</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">External merge sort turns merge sort into an I/O-aware pipeline: create sorted runs that fit in memory, then merge them with sequential reads instead of random access.</p>
  </div>
</div>
