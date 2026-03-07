<script lang="ts">
  interface State {
    right: number;
    deque: number[];
    max: number | null;
    note: string;
  }

  const values = [1, 3, -1, -3, 5, 3, 6, 7];
  const windowSize = 3;

  function buildStates(): State[] {
    const deque: number[] = [];
    const states: State[] = [];

    for (let right = 0; right < values.length; right++) {
      while (deque.length && deque[0] <= right - windowSize) {
        deque.shift();
      }
      while (deque.length && values[deque[deque.length - 1]] <= values[right]) {
        deque.pop();
      }
      deque.push(right);

      states.push({
        right,
        deque: [...deque],
        max: right >= windowSize - 1 ? values[deque[0]] : null,
        note: right >= windowSize - 1
          ? `Window [${right - windowSize + 1}, ${right}] keeps candidates in decreasing order, so the front is the max.`
          : 'Build the first full window before reading answers.',
      });
    }

    return states;
  }

  const states = buildStates();
  let stepIndex = windowSize - 1;
  $: state = states[stepIndex];
  $: left = Math.max(0, state.right - windowSize + 1);

  function prev() {
    stepIndex = Math.max(stepIndex - 1, 0);
  }

  function next() {
    stepIndex = Math.min(stepIndex + 1, states.length - 1);
  }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === states.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Index {state.right}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Current sliding window</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {#each values as value, index}
          <div class={`rounded-xl border p-3 text-center ${index >= left && index <= state.right ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
            <p class="text-[11px] text-muted-foreground mb-1">idx {index}</p>
            <p class="font-semibold">{value}</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Deque of candidates</p>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">front</span>
        {#each state.deque as index}
          <div class="rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-3 text-center min-w-20">
            <p class="text-[11px] text-muted-foreground mb-1">idx {index}</p>
            <p class="font-semibold">{values[index]}</p>
          </div>
        {/each}
        <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">back</span>
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Sliding-window maximum</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{state.note}</p>
    <p class="text-sm font-medium">Current max: {state.max ?? 'window not full yet'}</p>
  </div>
</div>
