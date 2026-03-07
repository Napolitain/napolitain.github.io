<script lang="ts">
  type Mode = 'bloom' | 'cuckoo';

  const bloomBits = [0, 1, 0, 1, 0, 1, 0, 0];
  const cuckooBuckets = [
    ['ab', ''],
    ['', 'k7'],
    ['m2', ''],
    ['', ''],
  ];

  let mode: Mode = 'bloom';
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'bloom' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'bloom')}>Bloom filter</button>
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'cuckoo' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'cuckoo')}>Cuckoo filter</button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    {#if mode === 'bloom'}
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Bit array after inserting a key</p>
        <div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {#each bloomBits as bit, index}
            <div class={`rounded-xl border p-3 text-center ${bit ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
              <p class="text-[11px] text-muted-foreground mb-1">bit {index}</p>
              <p class="font-semibold">{bit}</p>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="grid gap-3 sm:grid-cols-4">
        {#each cuckooBuckets as bucket, index}
          <div class="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
            <p class="text-sm font-medium">bucket {index}</p>
            {#each bucket as cell}
              <div class={`rounded-lg border px-3 py-2 text-sm ${cell ? 'border-primary bg-primary/10' : 'border-dashed border-border bg-background'}`}>
                {cell || 'empty'}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Approximate membership, tiny memory</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {mode === 'bloom'
        ? 'Bloom filters set a few bits per key. A zero bit proves absence; all ones only suggest possible presence.'
        : 'Cuckoo filters store short fingerprints in candidate buckets, which makes deletion practical while keeping the memory footprint tiny.'}
    </p>
  </div>
</div>
