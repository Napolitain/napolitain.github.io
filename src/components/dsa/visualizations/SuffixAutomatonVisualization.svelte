<script lang="ts">
  const states = [
    { id: 0, len: 0, link: '-', next: 'a -> 1, b -> 2' },
    { id: 1, len: 1, link: 0, next: 'b -> 2' },
    { id: 2, len: 2, link: 0, next: 'a -> 3' },
    { id: 3, len: 3, link: 1, next: '-' },
  ];
  let active = states[2];
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    {#each states as state}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.id === state.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = state)}>
        state {state.id}
      </button>
    {/each}
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-sm font-medium">Active state</p>
      <p class="text-sm text-muted-foreground">max length = {active.len}</p>
      <p class="text-sm text-muted-foreground">suffix link = {active.link}</p>
      <p class="text-sm text-muted-foreground">transitions: {active.next}</p>
    </div>
    <div class="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p class="text-sm font-medium">All states</p>
      {#each states as state}
        <div class={`rounded-xl border p-3 text-sm ${active.id === state.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          state {state.id}: len {state.len}, link {state.link}, {state.next}
        </div>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">A compact automaton of all substrings</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">Each state represents an equivalence class of substring endings. Suffix links jump to the next smaller context, which is why the automaton stays linear in size.</p>
  </div>
</div>
