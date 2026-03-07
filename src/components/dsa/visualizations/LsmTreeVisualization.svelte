<script lang="ts">
  const phases = [
    {
      label: 'write burst',
      items: ['memtable', 'WAL', 'L0 SSTable'],
      note: 'Writes land in memory first, then flush out as immutable sorted files.',
    },
    {
      label: 'compaction',
      items: ['L0 files', 'merge', 'L1 file'],
      note: 'Background compaction merges overlapping sorted runs into larger, cleaner levels.',
    },
  ];

  let active = phases[0];
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    {#each phases as phase}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.label === phase.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = phase)}>
        {phase.label}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-4">
    <div class="flex flex-wrap gap-3 items-center">
      {#each active.items as item, index}
        <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">{item}</div>
        {#if index < active.items.length - 1}
          <span class="text-muted-foreground">-></span>
        {/if}
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
      Reads consult multiple components, often using Bloom filters to skip SSTables that definitely do not contain the key.
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Write-optimized storage through sorted runs</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{active.note}</p>
  </div>
</div>
