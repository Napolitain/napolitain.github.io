<script lang="ts">
  const states = [
    { level: 3, note: 'Top lanes skip far ahead, so search does not need to walk every element.' },
    { level: 1, note: 'Once the correct region is found, lower levels refine the search.' },
  ];

  const levels = [
    ['1', '7', '15', '23'],
    ['1', '4', '7', '10', '15', '18', '23'],
    ['1', '4', '7', '9', '10', '12', '15', '18', '21', '23'],
  ];

  let active = states[0];
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    {#each states as state}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.level === state.level ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = state)}>
        {state.level === 3 ? 'high-level jumps' : 'bottom-level refinement'}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-4">
    {#each levels as row, rowIndex}
      <div class="flex flex-wrap gap-3 items-center">
        <span class="w-16 text-sm text-muted-foreground">level {levels.length - rowIndex}</span>
        {#each row as value}
          <div class={`rounded-xl border px-4 py-2 text-sm font-medium ${(active.level === 3 && rowIndex === 0) || (active.level === 1 && rowIndex === levels.length - 1) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            {value}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Ordered linked lists with express lanes</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{active.note}</p>
  </div>
</div>
