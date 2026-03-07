<script lang="ts">
  const rows = [
    { row: 0, bucket: 2, count: 5 },
    { row: 1, bucket: 5, count: 3 },
    { row: 2, bucket: 1, count: 4 },
  ];
</script>

<div class="space-y-6">
  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid gap-3 sm:grid-cols-3">
      {#each rows as row}
        <div class="rounded-xl border border-primary bg-primary/10 p-4">
          <p class="text-sm font-medium">hash row {row.row}</p>
          <p class="text-sm text-muted-foreground mt-1">bucket {row.bucket}</p>
          <p class="text-2xl font-semibold mt-2">{row.count}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
      The query estimate is the minimum touched counter: min(5, 3, 4) = 3.
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Approximate frequency from multiple hashed counters</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Each item increments one counter per row. Collisions can only overcount, so taking the minimum counter gives the tightest estimate available.</p>
  </div>
</div>
