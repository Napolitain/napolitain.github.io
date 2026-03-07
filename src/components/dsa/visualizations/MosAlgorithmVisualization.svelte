<script lang="ts">
  const queries = [
    { label: 'Q0 [1, 5]', block: 0, right: 5, moves: 'L: 0 -> 1, R: -1 -> 5' },
    { label: 'Q1 [2, 7]', block: 0, right: 7, moves: 'L: 1 -> 2, R: 5 -> 7' },
    { label: 'Q2 [0, 3]', block: 0, right: 3, moves: 'L: 2 -> 0, R: 7 -> 3' },
  ];
  let active = queries[1];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each queries as query}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.label === query.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = query)}>
        {query.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      {#each queries as query}
        <div class={`rounded-xl border p-3 ${active.label === query.label ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          <p class="font-semibold">{query.label}</p>
          <p class="text-sm text-muted-foreground">block {query.block}, right {query.right}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4">
      <p class="text-sm font-medium">Pointer movement for {active.label}</p>
      <p class="text-sm text-muted-foreground mt-2">{active.moves}</p>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Offline queries, cheap incremental maintenance</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Mo's algorithm reorders queries so the current range changes only a little from one query to the next. The savings come from pointer movement, not a fancy merge tree.</p>
  </div>
</div>
