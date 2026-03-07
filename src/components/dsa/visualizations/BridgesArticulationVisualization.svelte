<script lang="ts">
  const edges = [
    { from: '0', to: '1', bridge: false },
    { from: '1', to: '2', bridge: false },
    { from: '2', to: '0', bridge: false },
    { from: '1', to: '3', bridge: true },
    { from: '3', to: '4', bridge: false },
    { from: '4', to: '5', bridge: false },
    { from: '5', to: '3', bridge: false },
  ];

  const nodes = [
    { id: 0, disc: 0, low: 0, articulation: false },
    { id: 1, disc: 1, low: 0, articulation: true },
    { id: 2, disc: 2, low: 0, articulation: false },
    { id: 3, disc: 3, low: 3, articulation: true },
    { id: 4, disc: 4, low: 3, articulation: false },
    { id: 5, disc: 5, low: 3, articulation: false },
  ];

  let mode: 'bridge' | 'articulation' = 'bridge';
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'bridge' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'bridge')}>Show bridges</button>
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'articulation' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'articulation')}>Show articulation points</button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid gap-3 sm:grid-cols-2">
      {#each edges as edge}
        <div class={`rounded-xl border p-3 text-sm ${mode === 'bridge' && edge.bridge ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          {edge.from} - {edge.to}
        </div>
      {/each}
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each nodes as node}
        <div class={`rounded-xl border p-3 ${mode === 'articulation' && node.articulation ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          <p class="font-semibold">node {node.id}</p>
          <p class="text-sm text-muted-foreground">disc = {node.disc}</p>
          <p class="text-sm text-muted-foreground">low = {node.low}</p>
        </div>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">One low-link idea, two answers</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {mode === 'bridge'
        ? 'An edge (u, v) is a bridge when the child side cannot reach an ancestor of u, so low[v] > disc[u].'
        : 'A node becomes an articulation point when one of its DFS child subtrees cannot bypass it on the way back upward.'}
    </p>
  </div>
</div>
