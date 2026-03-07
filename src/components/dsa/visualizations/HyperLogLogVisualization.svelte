<script lang="ts">
  const items = [
    { bucket: '001011', leadingZeros: 0 },
    { bucket: '000101', leadingZeros: 2 },
    { bucket: '000001', leadingZeros: 5 },
    { bucket: '000111', leadingZeros: 3 },
  ];
</script>

<div class="space-y-6">
  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each items as item}
        <div class="rounded-xl border border-primary bg-primary/10 p-4">
          <p class="text-sm font-medium">hash suffix</p>
          <p class="text-lg font-mono mt-2">{item.bucket}</p>
          <p class="text-sm text-muted-foreground mt-2">leading zeros = {item.leadingZeros}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
      Registers keep the maximum leading-zero count they have seen. Those maxima are then combined into a cardinality estimate.
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Approximate distinct counting from hash patterns</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">If a register sees a hash with many leading zeros, that is evidence the stream is large enough that such a rare pattern has probably appeared. HyperLogLog turns those rare-pattern observations into an estimated distinct count.</p>
  </div>
</div>
