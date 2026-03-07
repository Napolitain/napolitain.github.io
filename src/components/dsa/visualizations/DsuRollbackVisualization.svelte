<script lang="ts">
  const states = [
    { label: 'after union(1,2)', stack: ['merge 1-2'], groups: '{1,2} {3} {4}' },
    { label: 'after union(2,3)', stack: ['merge 1-2', 'merge 2-3'], groups: '{1,2,3} {4}' },
    { label: 'after rollback()', stack: ['merge 1-2'], groups: '{1,2} {3} {4}' },
  ];
  let active = states[1];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each states as state}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.label === state.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = state)}>
        {state.label}
      </button>
    {/each}
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-sm font-medium">Rollback stack</p>
      {#each active.stack as item}
        <div class="rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-3 text-sm">{item}</div>
      {/each}
    </div>
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-sm font-medium">Current connected groups</p>
      <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">{active.groups}</div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Union-Find that can undo</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Every successful merge records just enough information to restore parent and size data later. That makes divide-and-conquer-on-time and offline dynamic connectivity possible.</p>
  </div>
</div>
