<script lang="ts">
  type SearchCase = {
    key: number;
    path: string[];
    note: string;
  };

  const cases: SearchCase[] = [
    {
      key: 7,
      path: ['root [10 | 20]', 'left child [3 | 7 | 9]'],
      note: 'One page-sized root decision narrows the search to the left child, then the key is found there.',
    },
    {
      key: 17,
      path: ['root [10 | 20]', 'middle child [12 | 15 | 18]'],
      note: 'Because each node holds many keys, the tree stays shallow and disk reads stay low.',
    },
    {
      key: 26,
      path: ['root [10 | 20]', 'right child [22 | 25 | 30]'],
      note: 'Fanout is the whole point: one node visit eliminates a large range of keys at once.',
    },
  ];

  const tree = [
    { label: 'root [10 | 20]', depth: 0 },
    { label: 'left child [3 | 7 | 9]', depth: 1 },
    { label: 'middle child [12 | 15 | 18]', depth: 1 },
    { label: 'right child [22 | 25 | 30]', depth: 1 },
  ];

  let active = cases[1];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each cases as item}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.key === item.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => (active = item)}
      >
        search {item.key}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="space-y-3">
      {#each tree as node}
        <div class={`rounded-xl border p-4 ${active.path.includes(node.label) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`} style={`margin-left:${node.depth * 2.5}rem;`}>
          <p class="font-medium">{node.label}</p>
        </div>
      {/each}
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Visited nodes</p>
      <div class="flex flex-wrap gap-3">
        {#each active.path as step}
          <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm">{step}</div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Wide nodes beat tall trees on disk</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{active.note}</p>
  </div>
</div>
