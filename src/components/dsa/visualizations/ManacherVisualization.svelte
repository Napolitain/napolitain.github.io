<script lang="ts">
  const text = '^#a#b#a#c#a#b#a#$';
  const centers = [
    { index: 6, radius: 6, note: 'Center on c in the transformed string; the palindrome expands symmetrically outward.' },
    { index: 4, radius: 2, note: 'Smaller centers reuse the rightmost known palindrome to skip redundant checks.' },
  ];
  let active = centers[0];
  function inPalindrome(index: number): boolean { return Math.abs(index - active.index) <= active.radius; }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    {#each centers as center}
      <button class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${active.index === center.index ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`} on:click={() => (active = center)}>
        center {center.index}
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div class="flex flex-wrap gap-2 text-lg font-mono">
      {#each text.split('') as char, index}
        <span class={`rounded-lg border px-3 py-2 ${index === active.index ? 'border-primary bg-primary/15' : inPalindrome(index) ? 'border-emerald-400 bg-emerald-500/10' : 'border-border bg-secondary/30'}`}>{char}</span>
      {/each}
    </div>

    <div class="rounded-xl border border-border bg-secondary/30 p-4">
      <p class="text-sm font-medium">Palindrome radius</p>
      <p class="text-2xl font-semibold mt-2">{active.radius}</p>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Palindromes around every center in linear time</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{active.note}</p>
  </div>
</div>
