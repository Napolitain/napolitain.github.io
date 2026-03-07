<script lang="ts">
  type Mode = 'point' | 'range';

  const leaves = [
    { label: '[1, 3, 5]', linked: true },
    { label: '[7, 9, 12]', linked: true },
    { label: '[15, 18, 21]', linked: true },
  ];

  let mode: Mode = 'range';
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'point' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'point')}>Point lookup</button>
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'range' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'range')}>Range scan</button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="space-y-3">
      <div class="rounded-xl border border-border bg-secondary/30 p-4">
        <p class="font-medium">internal node [7 | 15]</p>
        <p class="text-sm text-muted-foreground mt-1">Internal nodes route searches. Actual records live in the leaves.</p>
      </div>
      <div class="grid gap-3 md:grid-cols-3">
        {#each leaves as leaf, index}
          <div class={`rounded-xl border p-4 ${mode === 'range' ? 'border-primary bg-primary/10' : index === 1 ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="font-medium">leaf {leaf.label}</p>
            <p class="text-sm text-muted-foreground mt-1">{mode === 'range' ? 'Leaf links allow sequential range scanning.' : 'The search lands on one leaf, then checks within it.'}</p>
          </div>
        {/each}
      </div>
    </div>

    {#if mode === 'range'}
      <div class="flex items-center gap-3 flex-wrap">
        {#each leaves as leaf, index}
          <div class="rounded-xl border border-primary bg-primary/10 px-4 py-2 text-sm">{leaf.label}</div>
          {#if index < leaves.length - 1}
            <span class="text-muted-foreground">-></span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Leaves hold the real ordered data</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {mode === 'point'
        ? 'For point lookups, internal nodes act like a routing table down to one leaf page.'
        : 'For range queries, linked leaves are the superpower: once the first leaf is found, the scan can stream forward without climbing back up the tree.'}
    </p>
  </div>
</div>
