<script lang="ts">
  import { onMount } from 'svelte';

  let items: number[] = [];
  let nextValue = 24;
  let running = false;
  let activeEnd: 'front' | 'back' | null = null;
  let log: string[] = [];

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function reset() {
    items = [8, 12, 18];
    nextValue = 24;
    running = false;
    activeEnd = null;
    log = ['A deque supports efficient push/pop operations at both ends.'];
  }

  onMount(reset);

  function consumeNextValue(): number {
    const current = nextValue;
    nextValue += 6;
    return current;
  }

  async function highlight(end: 'front' | 'back') {
    activeEnd = end;
    await sleep(350);
    activeEnd = null;
  }

  async function pushFront() {
    if (running) {
      return;
    }

    running = true;
    const value = consumeNextValue();
    items = [value, ...items];
    log = [...log, `pushFront(${value}) — add work to the front`];
    await highlight('front');
    running = false;
  }

  async function pushBack() {
    if (running) {
      return;
    }

    running = true;
    const value = consumeNextValue();
    items = [...items, value];
    log = [...log, `pushBack(${value}) — classic queue enqueue`];
    await highlight('back');
    running = false;
  }

  async function popFront() {
    if (running) {
      return;
    }

    running = true;
    const removed = items[0];
    items = items.slice(1);
    log = [...log, removed === undefined ? 'popFront() — deque was empty' : `popFront() = ${removed} — classic queue dequeue`];
    await highlight('front');
    running = false;
  }

  async function popBack() {
    if (running) {
      return;
    }

    running = true;
    const removed = items[items.length - 1];
    items = items.slice(0, -1);
    log = [...log, removed === undefined ? 'popBack() — deque was empty' : `popBack() = ${removed} — stack-like pop from the back`];
    await highlight('back');
    running = false;
  }

  async function runDemo() {
    if (running) {
      return;
    }

    reset();
    running = true;
    log = ['Demo: one structure, two useful views — queue behavior and stack behavior.'];

    const enqueueValue = consumeNextValue();
    items = [...items, enqueueValue];
    log = [...log, `pushBack(${enqueueValue}) — enqueue like a queue`];
    await highlight('back');

    const dequeueValue = items[0];
    items = items.slice(1);
    log = [...log, `popFront() = ${dequeueValue} — dequeue from the other end`];
    await highlight('front');

    const frontValue = consumeNextValue();
    items = [frontValue, ...items];
    log = [...log, `pushFront(${frontValue}) — now use the front immediately`];
    await highlight('front');

    const backValue = items[items.length - 1];
    items = items.slice(0, -1);
    log = [...log, `popBack() = ${backValue} — the same deque also behaves like a stack`];
    await highlight('back');

    running = false;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={pushFront} disabled={running}>
      Push front
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={pushBack} disabled={running}>
      Push back
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={popFront} disabled={running}>
      Pop front
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={popBack} disabled={running}>
      Pop back
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={runDemo} disabled={running}>
      Run demo
    </button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer" on:click={reset} disabled={running}>
      Reset
    </button>
  </div>

  <div class="rounded-2xl border border-border bg-card p-6 space-y-5">
    <div class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span class={activeEnd === 'front' ? 'text-primary' : ''}>Front</span>
      <span class={activeEnd === 'back' ? 'text-primary' : ''}>Back</span>
    </div>

    {#if items.length === 0}
      <div class="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        The deque is empty.
      </div>
    {:else}
      <div class="flex flex-wrap items-center justify-center gap-3">
        {#each items as item, index}
          <div
            class={`min-w-16 rounded-xl border px-4 py-3 text-center font-semibold transition-colors ${index === 0 && activeEnd === 'front' ? 'border-primary bg-primary/10 text-primary' : index === items.length - 1 && activeEnd === 'back' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/30'}`}
          >
            {item}
          </div>
        {/each}
      </div>
    {/if}

    <div class="grid gap-3 md:grid-cols-2">
      <div class="rounded-xl border border-border bg-secondary/30 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Queue view</p>
        <p class="text-sm text-muted-foreground">Push at the back, pop at the front.</p>
      </div>
      <div class="rounded-xl border border-border bg-secondary/30 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Stack view</p>
        <p class="text-sm text-muted-foreground">Push and pop on the same end when LIFO behavior is what you need.</p>
      </div>
    </div>
  </div>

  <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
    {#each log as entry}
      <p class="text-muted-foreground">{entry}</p>
    {/each}
  </div>
</div>
