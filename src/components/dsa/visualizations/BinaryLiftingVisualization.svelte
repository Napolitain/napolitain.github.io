<script lang="ts">
  const up = [
    [null, null, null],
    [0, null, null],
    [0, null, null],
    [1, 0, null],
    [1, 0, null],
    [2, 0, null],
    [5, 2, null],
  ];

  const queries = [
    { node: 6, k: 1 },
    { node: 6, k: 3 },
    { node: 4, k: 2 },
  ];

  let selected = queries[1];

  function climbTrace(node: number, k: number) {
    const trace: { bit: number; from: number; to: number | null }[] = [];
    let current: number | null = node;
    let bit = 0;
    let remaining = k;

    while (remaining > 0 && current !== null) {
      if (remaining & 1) {
        const next = up[current][bit];
        trace.push({ bit, from: current, to: next });
        current = next;
      }
      remaining >>= 1;
      bit += 1;
    }

    return { trace, answer: current };
  }

  $: result = climbTrace(selected.node, selected.k);
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each queries as query}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${selected.node === query.node && selected.k === query.k ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => (selected = query)}
      >
        {query.k}-ancestor of {query.node}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Jump table</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th class="text-left p-3 border-b border-border">node</th>
              <th class="text-left p-3 border-b border-border">2^0</th>
              <th class="text-left p-3 border-b border-border">2^1</th>
              <th class="text-left p-3 border-b border-border">2^2</th>
            </tr>
          </thead>
          <tbody>
            {#each up as row, node}
              <tr class={selected.node === node ? 'bg-primary/5' : ''}>
                <td class="p-3 border-b border-border font-medium">{node}</td>
                {#each row as value}
                  <td class="p-3 border-b border-border">{value ?? '-'}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Bit decomposition of k = {selected.k}</p>
      <div class="flex flex-wrap gap-3">
        {#each result.trace as step}
          <div class="rounded-xl border border-primary bg-primary/10 p-3 text-sm">
            use 2^{step.bit}: {step.from} -> {step.to ?? 'none'}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Ancestor jumping by powers of two</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      To find the {selected.k}-ancestor of node {selected.node}, break {selected.k} into powers of two and follow only those jumps. Answer: {result.answer ?? 'none'}.
    </p>
  </div>
</div>
