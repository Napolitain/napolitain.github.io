<script lang="ts">
  type Query = {
    label: string;
    segments: { chain: string; left: number; right: number }[];
    note: string;
  };

  const nodes = [
    { id: 0, parent: '-', depth: 0, chain: 'A', pos: 0 },
    { id: 1, parent: 0, depth: 1, chain: 'A', pos: 1 },
    { id: 2, parent: 0, depth: 1, chain: 'C', pos: 5 },
    { id: 3, parent: 1, depth: 2, chain: 'A', pos: 2 },
    { id: 4, parent: 1, depth: 2, chain: 'B', pos: 4 },
    { id: 5, parent: 2, depth: 2, chain: 'C', pos: 6 },
    { id: 6, parent: 3, depth: 3, chain: 'A', pos: 3 },
    { id: 7, parent: 5, depth: 3, chain: 'C', pos: 7 },
  ];

  const queries: Query[] = [
    {
      label: 'path(6, 4)',
      segments: [
        { chain: 'B', left: 4, right: 4 },
        { chain: 'A', left: 1, right: 3 },
      ],
      note: 'The path crosses a light edge once, so it splits into one segment on chain B and one on chain A.',
    },
    {
      label: 'path(6, 7)',
      segments: [
        { chain: 'C', left: 5, right: 7 },
        { chain: 'A', left: 0, right: 3 },
      ],
      note: 'Climb chain heads until both nodes share a chain, then each piece is just a segment-tree interval.',
    },
  ];

  let activeQuery = queries[1];

  function inActiveSegment(nodePos: number): boolean {
    return activeQuery.segments.some(segment => nodePos >= segment.left && nodePos <= segment.right);
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each queries as query}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${activeQuery.label === query.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (activeQuery = query)}>
        {query.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th class="text-left p-3 border-b border-border">node</th>
            <th class="text-left p-3 border-b border-border">parent</th>
            <th class="text-left p-3 border-b border-border">depth</th>
            <th class="text-left p-3 border-b border-border">chain</th>
            <th class="text-left p-3 border-b border-border">base-array pos</th>
          </tr>
        </thead>
        <tbody>
          {#each nodes as node}
            <tr class={inActiveSegment(node.pos) ? 'bg-primary/5' : ''}>
              <td class="p-3 border-b border-border font-medium">{node.id}</td>
              <td class="p-3 border-b border-border">{node.parent}</td>
              <td class="p-3 border-b border-border">{node.depth}</td>
              <td class="p-3 border-b border-border">{node.chain}</td>
              <td class="p-3 border-b border-border">{node.pos}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Path broken into heavy-chain segments</p>
      <div class="flex flex-wrap gap-3">
        {#each activeQuery.segments as segment}
          <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm">
            chain {segment.chain}: [{segment.left}, {segment.right}]
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Tree paths become a few array segments</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{activeQuery.note}</p>
  </div>
</div>
