<script lang="ts">
  type Step = {
    matchStart: number;
    matchedLength: number;
    focusIndex: number;
    note: string;
  };

  const text = 'ababcabcabababd';
  const pattern = 'ababd';
  const lps = [0, 0, 1, 2, 0];

  const steps: Step[] = [
    { matchStart: 0, matchedLength: 0, focusIndex: 0, note: 'Start matching from the beginning of the pattern.' },
    { matchStart: 0, matchedLength: 4, focusIndex: 4, note: 'The prefix abab matches. The next comparison is text[4] against pattern[4].' },
    { matchStart: 2, matchedLength: 2, focusIndex: 4, note: 'Mismatch on c vs d. KMP falls back from length 4 to lps[3] = 2 instead of restarting.' },
    { matchStart: 4, matchedLength: 0, focusIndex: 4, note: 'Mismatch again, so the matched prefix shrinks to 0 and the scan continues.' },
    { matchStart: 10, matchedLength: 4, focusIndex: 14, note: 'Near the end, the pattern has rebuilt abab without rescanning old characters.' },
    { matchStart: 10, matchedLength: 5, focusIndex: 14, note: 'Full match found ending at index 14.' },
  ];

  let stepIndex = 0;
  $: step = steps[stepIndex];

  function prev() {
    stepIndex = Math.max(stepIndex - 1, 0);
  }

  function next() {
    stepIndex = Math.min(stepIndex + 1, steps.length - 1);
  }

  function textClass(index: number): string {
    if (index === step.focusIndex) return 'border-primary bg-primary/15';
    if (index >= step.matchStart && index < step.matchStart + step.matchedLength) return 'border-emerald-400 bg-emerald-500/10';
    return 'border-border bg-secondary/30';
  }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={stepIndex === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={stepIndex === steps.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Step {stepIndex + 1} / {steps.length}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Pattern and prefix table</p>
      <div class="grid grid-cols-5 gap-3">
        {#each pattern.split('') as char, index}
          <div class={`rounded-xl border p-3 text-center ${index < step.matchedLength ? 'border-emerald-400 bg-emerald-500/10' : 'border-border bg-secondary/30'}`}>
            <p class="font-semibold">{char}</p>
            <p class="text-[11px] text-muted-foreground mt-1">lps = {lps[index]}</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Text scan</p>
      <div class="flex flex-wrap gap-2 text-lg font-mono">
        {#each text.split('') as char, index}
          <span class={`rounded-lg border px-3 py-2 ${textClass(index)}`}>{char}</span>
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Fallback without rescanning</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{step.note}</p>
  </div>
</div>
