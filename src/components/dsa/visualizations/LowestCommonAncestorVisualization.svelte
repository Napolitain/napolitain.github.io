<script lang="ts">
  type Query = { a: number; b: number; answer: number };

  const parent = [null, 0, 0, 1, 1, 2, 5];
  const depth = [0, 1, 1, 2, 2, 2, 3];
  const queries: Query[] = [
    { a: 3, b: 4, answer: 1 },
    { a: 3, b: 6, answer: 0 },
    { a: 5, b: 6, answer: 5 },
  ];

  let activeQuery = queries[1];

  function pathToRoot(node: number): number[] {
    const path: number[] = [];
    let current: number | null = node;
    while (current !== null) {
      path.push(current);
      current = parent[current] as number | null;
    }
    return path;
  }

  $: pathA = pathToRoot(activeQuery.a);
  $: pathB = pathToRoot(activeQuery.b);
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each queries as query}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${activeQuery.a === query.a && activeQuery.b === query.b ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => (activeQuery = query)}
      >
        LCA({query.a}, {query.b})
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each depth as value, node}
        <div class={`rounded-xl border p-3 ${node === activeQuery.answer ? 'border-primary bg-primary/10' : node === activeQuery.a || node === activeQuery.b ? 'border-amber-400 bg-amber-500/10' : 'border-border bg-secondary/30'}`}>
          <p class="font-semibold">node {node}</p>
          <p class="text-sm text-muted-foreground">parent: {parent[node] ?? 'none'}</p>
          <p class="text-sm text-muted-foreground">depth: {value}</p>
        </div>
      {/each}
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border border-border bg-secondary/30 p-4">
        <p class="text-sm font-medium mb-2">Path from {activeQuery.a} to root</p>
        <div class="flex flex-wrap gap-2">
          {#each pathA as node}
            <span class={`rounded-lg border px-3 py-2 text-sm ${node === activeQuery.answer ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>{node}</span>
          {/each}
        </div>
      </div>
      <div class="rounded-xl border border-border bg-secondary/30 p-4">
        <p class="text-sm font-medium mb-2">Path from {activeQuery.b} to root</p>
        <div class="flex flex-wrap gap-2">
          {#each pathB as node}
            <span class={`rounded-lg border px-3 py-2 text-sm ${node === activeQuery.answer ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>{node}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">First shared ancestor</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">The lowest common ancestor of {activeQuery.a} and {activeQuery.b} is {activeQuery.answer}: the deepest node that lies on both root paths.</p>
  </div>
</div>
