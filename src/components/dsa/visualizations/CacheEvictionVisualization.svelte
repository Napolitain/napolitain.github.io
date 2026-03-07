<script lang="ts">
  const policies = [
    { name: 'LRU', state: 'keep most recently touched items', note: 'Recency-only. Simple and common, but repeated one-hit wonders can still pollute the cache.' },
    { name: 'LFU', state: 'keep most frequently touched items', note: 'Frequency-only. Good for stable hot sets, but stale history can become sticky.' },
    { name: 'ARC', state: 'balance recency and frequency adaptively', note: 'ARC keeps ghost histories so it can shift weight between recency and frequency automatically.' },
    { name: 'TinyLFU', state: 'admit only items with enough estimated future value', note: 'TinyLFU separates admission from eviction and often relies on sketches for cheap frequency estimates.' },
  ];
  let active = policies[0];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each policies as policy}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.name === policy.name ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = policy)}>
        {policy.name}
      </button>
    {/each}
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-sm font-medium">What the policy optimizes</p>
      <div class="rounded-xl border border-primary bg-primary/10 p-4 text-sm">{active.state}</div>
    </div>
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-sm font-medium">Trade-off</p>
      <div class="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">{active.note}</div>
    </div>
  </div>
</div>
