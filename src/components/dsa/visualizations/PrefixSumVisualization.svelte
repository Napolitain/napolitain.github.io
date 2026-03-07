<script lang="ts">
  type Query = { label: string; left: number; right: number };

  const values = [3, 1, 4, 2, 5, 1];
  const prefix = [0];
  for (const value of values) {
    prefix.push(prefix[prefix.length - 1] + value);
  }

  const queries: Query[] = [
    { label: 'sum[0, 2]', left: 0, right: 2 },
    { label: 'sum[1, 4]', left: 1, right: 4 },
    { label: 'sum[2, 5]', left: 2, right: 5 },
  ];

  let activeQuery = queries[1];

  function rangeSum(query: Query): number {
    return prefix[query.right + 1] - prefix[query.left];
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each queries as query}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${activeQuery.label === query.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => (activeQuery = query)}
      >
        {query.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Base array</p>
      <div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {#each values as value, index}
          <div class={`rounded-xl border p-3 text-center ${index >= activeQuery.left && index <= activeQuery.right ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="text-[11px] text-muted-foreground mb-1">idx {index}</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Prefix array</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {#each prefix as value, index}
          <div class={`rounded-xl border p-3 text-center ${index === activeQuery.left || index === activeQuery.right + 1 ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="text-[11px] text-muted-foreground mb-1">p[{index}]</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Range sum from two prefix values</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {activeQuery.label} = prefix[{activeQuery.right + 1}] - prefix[{activeQuery.left}] = {prefix[activeQuery.right + 1]} - {prefix[activeQuery.left]} = {rangeSum(activeQuery)}.
    </p>
  </div>
</div>
