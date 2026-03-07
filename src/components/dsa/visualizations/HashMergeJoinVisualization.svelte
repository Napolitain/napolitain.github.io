<script lang="ts">
  type Mode = 'hash' | 'merge';
  let mode: Mode = 'hash';
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'hash' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'hash')}>Hash join</button>
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'merge' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'merge')}>Merge join</button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    {#if mode === 'hash'}
      <div class="flex flex-wrap gap-3 items-center">
        <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">build hash table on smaller input</div>
        <span class="text-muted-foreground">-></span>
        <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">probe larger input</div>
      </div>
    {:else}
      <div class="flex flex-wrap gap-3 items-center">
        <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">sort both inputs</div>
        <span class="text-muted-foreground">-></span>
        <div class="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-medium">advance two pointers through ordered rows</div>
      </div>
    {/if}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Different joins win under different access patterns</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {mode === 'hash'
        ? 'Hash join is usually the default when equality predicates dominate and one side fits comfortably as a hash table.'
        : 'Merge join shines when both inputs are already sorted or can be sorted efficiently, especially for ordered or range-friendly pipelines.'}
    </p>
  </div>
</div>
