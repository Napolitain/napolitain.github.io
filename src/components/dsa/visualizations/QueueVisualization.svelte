<script lang="ts">
  type Step = {
    queue: string[];
    action: string;
    note: string;
  };

  const steps: Step[] = [
    { queue: [], action: 'Start empty', note: 'A queue processes items in first-in, first-out order.' },
    { queue: ['A'], action: 'enqueue(A)', note: 'A arrives first, so A must leave first too.' },
    { queue: ['A', 'B'], action: 'enqueue(B)', note: 'B joins behind A at the back of the queue.' },
    { queue: ['A', 'B', 'C'], action: 'enqueue(C)', note: 'New work always enters at the back.' },
    { queue: ['B', 'C'], action: 'dequeue() -> A', note: 'Removing from the front preserves FIFO order.' },
    { queue: ['B', 'C', 'D'], action: 'enqueue(D)', note: 'After A leaves, B is now the front item.' },
  ];

  let stepIndex = 0;
  $: step = steps[stepIndex];

  function prev() {
    stepIndex = Math.max(stepIndex - 1, 0);
  }

  function next() {
    stepIndex = Math.min(stepIndex + 1, steps.length - 1);
  }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === steps.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Step {stepIndex + 1} / {steps.length}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="flex items-center gap-4 flex-wrap">
      <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">front</span>
      <div class="flex flex-wrap gap-3">
        {#if step.queue.length === 0}
          <div class="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">empty queue</div>
        {:else}
          {#each step.queue as item, index}
            <div class={`rounded-xl border px-4 py-3 min-w-16 text-center ${index === 0 ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
              <p class="text-[11px] text-muted-foreground mb-1">{index === 0 ? 'next out' : 'waiting'}</p>
              <p class="font-semibold">{item}</p>
            </div>
          {/each}
        {/if}
      </div>
      <span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">back</span>
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4">
      <p class="text-sm font-medium">{step.action}</p>
      <p class="text-sm text-muted-foreground mt-2 leading-relaxed">{step.note}</p>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Why queues matter</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Queues model fair processing. The oldest item gets handled first, which is exactly why BFS discovers nodes level by level, schedulers process jobs in arrival order, and streaming systems buffer work without reordering it.</p>
  </div>
</div>
