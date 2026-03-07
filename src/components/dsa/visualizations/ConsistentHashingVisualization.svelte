<script lang="ts">
  type Mode = 'before' | 'after';

  const placements = {
    before: [
      { key: 'user:17', server: 'A' },
      { key: 'post:88', server: 'B' },
      { key: 'feed:9', server: 'C' },
    ],
    after: [
      { key: 'user:17', server: 'A' },
      { key: 'post:88', server: 'D' },
      { key: 'feed:9', server: 'C' },
    ],
  } satisfies Record<Mode, { key: string; server: string }[]>;

  let mode: Mode = 'before';
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'before' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'before')}>Before adding D</button>
    <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'after' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (mode = 'after')}>After adding D</button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      {#each placements[mode] as placement}
        <div class="rounded-xl border border-primary bg-primary/10 p-4">
          <p class="font-medium">{placement.key}</p>
          <p class="text-sm text-muted-foreground mt-1">server {placement.server}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
      Only keys near the new server's position on the hash ring move. Everyone else stays where they were.
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Stable sharding under cluster changes</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Consistent hashing avoids full remapping when servers are added or removed. That is why it is so common in distributed caches and partitioned key-value systems.</p>
  </div>
</div>
