<script lang="ts">
  const patterns = ['he', 'she', 'his', 'hers'];
  const matches = [
    { index: 1, pattern: 'she' },
    { index: 2, pattern: 'he' },
    { index: 2, pattern: 'hers' },
  ];
  const text = 'ushers';
  let cursor = 0;

  function next() {
    cursor = Math.min(cursor + 1, text.length - 1);
  }

  function prev() {
    cursor = Math.max(cursor - 1, 0);
  }

  function activeMatches() {
    return matches.filter(match => match.index <= cursor);
  }
</script>

<div class="space-y-6">
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={prev} disabled={cursor === 0}>Prev</button>
    <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer disabled:opacity-50" on:click={next} disabled={cursor === text.length - 1}>Next</button>
    <p class="text-sm text-muted-foreground self-center">Reading index {cursor}</p>
  </div>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Patterns stored in one trie with failure links</p>
      <div class="flex flex-wrap gap-3">
        {#each patterns as pattern}
          <div class="rounded-xl border border-border bg-secondary/30 px-4 py-2 text-sm font-medium">{pattern}</div>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Scan text once</p>
      <div class="flex flex-wrap gap-2 text-xl font-mono">
        {#each text.split('') as char, index}
          <span class={`rounded-lg px-3 py-2 border ${index === cursor ? 'border-primary bg-primary/10' : index < cursor ? 'border-emerald-400 bg-emerald-500/10' : 'border-border bg-secondary/30'}`}>
            {char}
          </span>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Matches found so far</p>
      <div class="flex flex-wrap gap-3">
        {#each activeMatches() as match}
          <div class="rounded-xl border border-primary bg-primary/10 px-4 py-2 text-sm">
            ends at {match.index}: {match.pattern}
          </div>
        {/each}
        {#if activeMatches().length === 0}
          <p class="text-sm text-muted-foreground">No completed pattern yet.</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">Many patterns, one pass</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Aho-Corasick starts from a trie, then adds failure links so mismatches can fall back without restarting from scratch. That lets one scan of the text report every pattern occurrence.
    </p>
  </div>
</div>
