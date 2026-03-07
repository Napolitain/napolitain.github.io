<script lang="ts">
  const text = 'abracadabra';
  const pattern = 'abra';
  const windows = [
    { start: 0, hash: 114, match: true },
    { start: 1, hash: 89, match: false },
    { start: 2, hash: 76, match: false },
    { start: 7, hash: 114, match: true },
  ];
  let stepIndex = 0;
  $: window = windows[stepIndex];
  function prev() { stepIndex = Math.max(stepIndex - 1, 0); }
  function next() { stepIndex = Math.min(stepIndex + 1, windows.length - 1); }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === windows.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Window starting at {window.start}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="flex flex-wrap gap-2 text-lg font-mono">
      {#each text.split('') as char, index}
        <span class={`rounded-lg border px-3 py-2 ${index >= window.start && index < window.start + pattern.length ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>{char}</span>
      {/each}
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-border bg-secondary/30 p-4">
        <p class="text-sm font-medium">Pattern hash</p>
        <p class="text-2xl font-semibold mt-2">114</p>
      </div>
      <div class={`rounded-xl border p-4 ${window.match ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
        <p class="text-sm font-medium">Window hash</p>
        <p class="text-2xl font-semibold mt-2">{window.hash}</p>
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Rolling hashes skip most character comparisons</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{window.match ? 'The hashes match, so Rabin-Karp verifies the characters and reports an occurrence.' : 'The hashes differ, so this window cannot match and no character-by-character check is needed.'}</p>
  </div>
</div>
