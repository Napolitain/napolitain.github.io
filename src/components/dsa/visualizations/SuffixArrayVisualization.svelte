<script lang="ts">
  const suffixes = [
    { index: 10, value: 'a' },
    { index: 7, value: 'abra' },
    { index: 0, value: 'abracadabra' },
    { index: 3, value: 'acadabra' },
    { index: 5, value: 'adabra' },
  ];
  let active = suffixes[2];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each suffixes as suffix}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.index === suffix.index ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = suffix)}>
        rank {suffixes.indexOf(suffix)}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="rounded-xl border border-primary bg-primary/10 p-4">
      <p class="text-sm font-medium">Selected suffix</p>
      <p class="text-lg font-mono mt-2">[{active.index}] {active.value}</p>
    </div>

    <div class="space-y-2">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sorted suffix order</p>
      {#each suffixes as suffix, rank}
        <div class={`rounded-xl border p-3 text-sm font-mono ${active.index === suffix.index ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          rank {rank}: [{suffix.index}] {suffix.value}
        </div>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Sort every suffix once</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Binary searching this sorted suffix list turns substring existence queries into prefix comparisons against ranks rather than scanning the whole text.</p>
  </div>
</div>
