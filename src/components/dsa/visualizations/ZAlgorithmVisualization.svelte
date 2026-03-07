<script lang="ts">
  type State = {
    index: number;
    left: number;
    right: number;
    z: Array<number | null>;
    note: string;
  };

  const text = 'aabaaab';
  const states: State[] = [
    { index: 1, left: 1, right: 1, z: [0, 1, null, null, null, null, null], note: 'At index 1, match one character with the prefix, so the Z-box becomes [1, 1].' },
    { index: 2, left: 1, right: 1, z: [0, 1, 0, null, null, null, null], note: 'Index 2 mismatches immediately, so z[2] = 0.' },
    { index: 3, left: 3, right: 4, z: [0, 1, 0, 2, null, null, null], note: 'A new prefix match starts at 3, creating Z-box [3, 4].' },
    { index: 4, left: 4, right: 6, z: [0, 1, 0, 2, 3, null, null], note: 'Index 4 reuses the existing box, then extends it to length 3.' },
    { index: 5, left: 4, right: 6, z: [0, 1, 0, 2, 3, 1, null], note: 'Inside the box, part of the answer is copied from earlier work.' },
    { index: 6, left: 4, right: 6, z: [0, 1, 0, 2, 3, 1, 0], note: 'Final position mismatches immediately, so z[6] = 0.' },
  ];

  let stepIndex = 0;
  $: state = states[stepIndex];

  function prev() {
    stepIndex = Math.max(stepIndex - 1, 0);
  }

  function next() {
    stepIndex = Math.min(stepIndex + 1, states.length - 1);
  }

  function charClass(index: number): string {
    if (index === state.index) return 'border-primary bg-primary/15';
    if (index >= state.left && index <= state.right) return 'border-emerald-400 bg-emerald-500/10';
    return 'border-border bg-secondary/30';
  }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === states.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Index {state.index}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Current Z-box</p>
      <div class="flex flex-wrap gap-2 text-lg font-mono">
        {#each text.split('') as char, index}
          <span class={`rounded-lg border px-3 py-2 ${charClass(index)}`}>{char}</span>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Known Z values</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {#each state.z as value, index}
          <div class={`rounded-xl border p-3 text-center ${index === state.index ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="text-[11px] text-muted-foreground mb-1">z[{index}]</p>
            <p class="font-semibold">{value ?? '-'}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Reuse the active prefix box</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{state.note}</p>
  </div>
</div>
