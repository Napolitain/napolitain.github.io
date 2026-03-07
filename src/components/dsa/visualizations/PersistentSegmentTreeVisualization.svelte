<script lang="ts">
  const versions = [
    { label: 'v0', values: [2, 1, 4, 3] },
    { label: 'v1', values: [2, 5, 4, 3] },
    { label: 'v2', values: [2, 5, 4, 7] },
  ];
  let active = versions[2];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each versions as version}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.label === version.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = version)}>
        {version.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each active.values as value, index}
        <div class="rounded-xl border border-primary bg-primary/10 p-3 text-center">
          <p class="text-[11px] text-muted-foreground mb-1">idx {index}</p>
          <p class="font-semibold">{value}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
      Only O(log n) nodes changed from the previous version; the untouched nodes are shared structurally.
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Versions are first-class</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Persistence means updates do not destroy old history. Each new root points to a mostly shared tree, which is why old answers stay available cheaply.</p>
  </div>
</div>
