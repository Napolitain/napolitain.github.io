<script lang="ts">
  const tin = { a: 0, b: 1, d: 2, e: 3, c: 4, f: 5, g: 6 };
  const tout = { a: 6, b: 3, d: 2, e: 3, c: 6, f: 5, g: 6 };
  const flat = ['a', 'b', 'd', 'e', 'c', 'f', 'g'];
  const children = {
    a: ['b', 'c'],
    b: ['d', 'e'],
    c: ['f', 'g'],
    d: [],
    e: [],
    f: [],
    g: [],
  } satisfies Record<string, string[]>;

  const nodes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  let selected = 'b';

  function subtreeRange(node: string) {
    return { left: tin[node as keyof typeof tin], right: tout[node as keyof typeof tout] };
  }

  function isInSubtree(node: string): boolean {
    const { left, right } = subtreeRange(selected);
    const t = tin[node as keyof typeof tin];
    return t >= left && t <= right;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each nodes as node}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${selected === node ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => (selected = node)}
      >
        Select {node.toUpperCase()}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">DFS order flattened into an array</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {#each flat as node, index}
          <div class={`rounded-xl border p-3 text-center ${isInSubtree(node) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="text-[11px] text-muted-foreground mb-1">tour {index}</p>
            <p class="font-semibold">{node.toUpperCase()}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each nodes as node}
        <div class={`rounded-xl border p-4 ${selected === node ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          <p class="font-semibold mb-1">Node {node.toUpperCase()}</p>
          <p class="text-sm text-muted-foreground">tin = {tin[node as keyof typeof tin]}, tout = {tout[node as keyof typeof tout]}</p>
          <p class="text-sm text-muted-foreground">children: {children[node].length ? children[node].join(', ').toUpperCase() : 'none'}</p>
        </div>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Subtree of {selected.toUpperCase()}</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      DFS entry times make the subtree of {selected.toUpperCase()} become one contiguous interval: [{subtreeRange(selected).left}, {subtreeRange(selected).right}]. That is why tree problems can be turned into array range queries.
    </p>
  </div>
</div>
