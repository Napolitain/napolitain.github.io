<script lang="ts">
  interface Query {
    label: string;
    left: number;
    right: number;
  }

  const values = [7, 2, 3, 0, 5, 10, 3, 12];
  const queries: Query[] = [
    { label: 'RMQ[0, 4]', left: 0, right: 4 },
    { label: 'RMQ[1, 6]', left: 1, right: 6 },
    { label: 'RMQ[3, 7]', left: 3, right: 7 },
  ];

  function buildSparseTable(arr: number[]): (number | null)[][] {
    const maxK = Math.floor(Math.log2(arr.length));
    const table: (number | null)[][] = Array.from({ length: maxK + 1 }, () => Array(arr.length).fill(null));
    for (let i = 0; i < arr.length; i++) {
      table[0][i] = arr[i];
    }
    for (let k = 1; k <= maxK; k++) {
      const span = 1 << k;
      const half = span >> 1;
      for (let start = 0; start + span <= arr.length; start++) {
        table[k][start] = Math.min(table[k - 1][start]!, table[k - 1][start + half]!);
      }
    }
    return table;
  }

  const table = buildSparseTable(values);
  let activeQuery: Query = queries[1];
  let activePower = 0;
  let leftStart = 0;
  let rightStart = 0;
  let span = 1;
  let answer = 0;
  let log = '';

  function selectQuery(query: Query) {
    activeQuery = query;
    const length = query.right - query.left + 1;
    activePower = Math.floor(Math.log2(length));
    span = 1 << activePower;
    leftStart = query.left;
    rightStart = query.right - span + 1;
    answer = Math.min(table[activePower][leftStart]!, table[activePower][rightStart]!);
    log = `Use two overlapping blocks of length ${span}: [${leftStart}, ${leftStart + span - 1}] and [${rightStart}, ${rightStart + span - 1}]. This works because min is idempotent.`;
  }

  selectQuery(activeQuery);

  function arrayColor(index: number): string {
    const inLeft = index >= leftStart && index < leftStart + span;
    const inRight = index >= rightStart && index < rightStart + span;
    if (inLeft && inRight) return 'bg-violet-500/20 border-violet-400';
    if (inLeft) return 'bg-blue-500/10 border-blue-400';
    if (inRight) return 'bg-green-500/10 border-green-400';
    if (index >= activeQuery.left && index <= activeQuery.right) return 'bg-amber-500/10 border-amber-400';
    return 'bg-secondary/30 border-border';
  }

  function cellHighlighted(k: number, start: number): boolean {
    return k === activePower && (start === leftStart || start === rightStart);
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each queries as query}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${activeQuery.label === query.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => selectQuery(query)}
      >
        {query.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Array</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {#each values as value, index}
          <div class={`rounded-xl border p-3 text-center ${arrayColor(index)}`}>
            <p class="text-[11px] text-muted-foreground mb-1">idx {index}</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="space-y-3">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sparse table layers</p>
      {#each table as row, k}
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">2^{k} block length = {1 << k}</p>
          <div class="grid gap-2" style={`grid-template-columns: repeat(${values.length}, minmax(0, 1fr));`}>
            {#each row as value, start}
              {#if value !== null}
                <div class={`rounded-lg border p-2 text-center text-sm ${cellHighlighted(k, start) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
                  <p class="text-[11px] text-muted-foreground">[{start}, {start + (1 << k) - 1}]</p>
                  <p class="font-semibold">{value}</p>
                </div>
              {:else}
                <div></div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Static queries, no updates</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{log}</p>
    <p class="text-sm text-foreground font-medium">Answer for {activeQuery.label}: {answer}</p>
  </div>
</div>
