<script lang="ts">
  type Update = { label: string; left: number; right: number; delta: number };

  const base = [2, 2, 2, 2, 2, 2];
  const updates: Update[] = [
    { label: '+3 on [1, 4]', left: 1, right: 4, delta: 3 },
    { label: '-2 on [0, 2]', left: 0, right: 2, delta: -2 },
    { label: '+4 on [3, 5]', left: 3, right: 5, delta: 4 },
  ];

  let appliedCount = 2;

  function buildDiff(count: number): number[] {
    const diff = Array(base.length + 1).fill(0);
    for (const update of updates.slice(0, count)) {
      diff[update.left] += update.delta;
      if (update.right + 1 < diff.length) {
        diff[update.right + 1] -= update.delta;
      }
    }
    return diff;
  }

  function rebuildArray(diff: number[]): number[] {
    const rebuilt: number[] = [];
    let running = 0;
    for (let i = 0; i < base.length; i++) {
      running += diff[i];
      rebuilt.push(base[i] + running);
    }
    return rebuilt;
  }

  $: diff = buildDiff(appliedCount);
  $: rebuilt = rebuildArray(diff);
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each updates as update, index}
      <button
        class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${appliedCount === index + 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
        on:click={() => (appliedCount = index + 1)}
      >
        Apply first {index + 1}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Pending range updates</p>
      <div class="grid gap-3 sm:grid-cols-3">
        {#each updates as update, index}
          <div class={`rounded-xl border p-3 ${index < appliedCount ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="font-medium">{update.label}</p>
            <p class="text-sm text-muted-foreground mt-1">Touch only diff[{update.left}] and diff[{update.right + 1}]</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Difference array markers</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {#each diff as value, index}
          <div class={`rounded-xl border p-3 text-center ${index < base.length ? 'border-border bg-secondary/30' : 'border-dashed border-border bg-secondary/10'}`}>
            <p class="text-[11px] text-muted-foreground mb-1">d[{index}]</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Reconstructed final array</p>
      <div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {#each rebuilt as value, index}
          <div class="rounded-xl border border-primary bg-primary/10 p-3 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">idx {index}</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Cheap range updates, one rebuild pass</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">A difference array marks where an update starts and where it stops. A prefix sum over those markers reconstructs the actual values, which is why difference arrays and prefix sums are really two halves of the same idea.</p>
  </div>
</div>
