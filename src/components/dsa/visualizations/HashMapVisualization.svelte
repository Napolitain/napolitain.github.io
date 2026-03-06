<script lang="ts">
  const NUM_BUCKETS = 8;

  interface Entry { key: string; value: string; id: number }

  let buckets: Entry[][] = $state(Array.from({ length: NUM_BUCKETS }, () => [] as Entry[]));
  let keyInput = $state('');
  let valueInput = $state('');
  let running = $state(false);
  let log: string[] = $state([]);
  let highlightBucket = $state(-1);
  let highlightEntry = $state(-1);
  let hashingPhase: 'idle' | 'hashing' | 'target' | 'traversing' | 'found' | 'collision' | 'inserted' | 'deleted' = $state('idle');
  let speed = $state(500);
  let nextId = $state(0);

  function hash(key: string): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (h * 31 + key.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms * (1000 / (speed + 1))));
  }

  function totalEntries(): number {
    return buckets.reduce((sum, b) => sum + b.length, 0);
  }

  function loadFactor(): string {
    return (totalEntries() / NUM_BUCKETS).toFixed(2);
  }

  function reset() {
    buckets = Array.from({ length: NUM_BUCKETS }, () => []);
    keyInput = '';
    valueInput = '';
    log = [];
    highlightBucket = -1;
    highlightEntry = -1;
    hashingPhase = 'idle';
    running = false;
    nextId = 0;
  }

  function randomize() {
    reset();
    const samples: [string, string][] = [
      ['cat', '🐱'], ['dog', '🐶'], ['fish', '🐟'], ['bird', '🐦'],
      ['fox', '🦊'], ['owl', '🦉'], ['bee', '🐝'], ['ant', '🐜'],
      ['bat', '🦇'], ['cow', '🐄'],
    ];
    for (const [k, v] of samples) {
      const idx = hash(k) % NUM_BUCKETS;
      const chain = buckets[idx];
      const existing = chain.findIndex(e => e.key === k);
      if (existing >= 0) {
        chain[existing] = { ...chain[existing], value: v };
      } else {
        chain.push({ key: k, value: v, id: nextId++ });
      }
    }
    buckets = [...buckets];
    log = ['Pre-filled with sample data'];
  }

  async function put() {
    if (!keyInput.trim() || running) return;
    const key = keyInput.trim();
    const value = valueInput.trim() || '—';
    running = true;

    const h = hash(key);
    const idx = h % NUM_BUCKETS;

    hashingPhase = 'hashing';
    log = [...log, `hash('${key}') = ${h} → bucket ${h} % ${NUM_BUCKETS} = ${idx}`];
    await sleep(400);

    hashingPhase = 'target';
    highlightBucket = idx;
    await sleep(400);

    const chain = buckets[idx];
    hashingPhase = 'traversing';

    for (let i = 0; i < chain.length; i++) {
      highlightEntry = chain[i].id;
      await sleep(300);
      if (chain[i].key === key) {
        chain[i] = { ...chain[i], value };
        buckets = [...buckets];
        hashingPhase = 'found';
        log = [...log, `Updated '${key}' = '${value}'`];
        await sleep(500);
        cleanup();
        return;
      }
    }

    if (chain.length > 0) {
      hashingPhase = 'collision';
      log = [...log, `Collision at bucket ${idx}! Chaining...`];
      await sleep(400);
    }

    chain.push({ key, value, id: nextId++ });
    buckets = [...buckets];
    hashingPhase = 'inserted';
    highlightEntry = nextId - 1;
    log = [...log, `Inserted '${key}' = '${value}' (load factor: ${loadFactor()})`];
    await sleep(500);
    cleanup();
  }

  async function get() {
    if (!keyInput.trim() || running) return;
    const key = keyInput.trim();
    running = true;

    const h = hash(key);
    const idx = h % NUM_BUCKETS;

    hashingPhase = 'hashing';
    log = [...log, `hash('${key}') = ${h} → bucket ${h} % ${NUM_BUCKETS} = ${idx}`];
    await sleep(400);

    hashingPhase = 'target';
    highlightBucket = idx;
    await sleep(400);

    const chain = buckets[idx];
    hashingPhase = 'traversing';

    for (let i = 0; i < chain.length; i++) {
      highlightEntry = chain[i].id;
      await sleep(350);
      if (chain[i].key === key) {
        hashingPhase = 'found';
        log = [...log, `Found '${key}' = '${chain[i].value}'`];
        await sleep(600);
        cleanup();
        return;
      }
    }

    hashingPhase = 'idle';
    log = [...log, `'${key}' not found`];
    await sleep(400);
    cleanup();
  }

  async function del() {
    if (!keyInput.trim() || running) return;
    const key = keyInput.trim();
    running = true;

    const h = hash(key);
    const idx = h % NUM_BUCKETS;

    hashingPhase = 'hashing';
    log = [...log, `hash('${key}') = ${h} → bucket ${h} % ${NUM_BUCKETS} = ${idx}`];
    await sleep(400);

    hashingPhase = 'target';
    highlightBucket = idx;
    await sleep(400);

    const chain = buckets[idx];
    hashingPhase = 'traversing';

    for (let i = 0; i < chain.length; i++) {
      highlightEntry = chain[i].id;
      await sleep(350);
      if (chain[i].key === key) {
        hashingPhase = 'deleted';
        log = [...log, `Deleted '${key}'`];
        chain.splice(i, 1);
        buckets = [...buckets];
        await sleep(500);
        cleanup();
        return;
      }
    }

    hashingPhase = 'idle';
    log = [...log, `'${key}' not found — nothing to delete`];
    await sleep(400);
    cleanup();
  }

  function cleanup() {
    highlightBucket = -1;
    highlightEntry = -1;
    hashingPhase = 'idle';
    running = false;
  }

  function bucketColor(i: number): string {
    if (highlightBucket !== i) return 'var(--muted)';
    if (hashingPhase === 'target' || hashingPhase === 'traversing') return '#3b82f6';
    if (hashingPhase === 'found' || hashingPhase === 'inserted') return '#22c55e';
    if (hashingPhase === 'collision') return '#ef4444';
    if (hashingPhase === 'deleted') return '#ef4444';
    return '#3b82f6';
  }

  function entryColor(entry: Entry, bucketIdx: number): string {
    if (highlightBucket !== bucketIdx) return 'var(--muted)';
    if (highlightEntry === entry.id) {
      if (hashingPhase === 'found') return '#22c55e';
      if (hashingPhase === 'deleted') return '#ef4444';
      if (hashingPhase === 'inserted') return '#22c55e';
      if (hashingPhase === 'traversing') return '#facc15';
      return '#3b82f6';
    }
    return 'var(--muted)';
  }

  const bucketW = 56;
  const bucketGap = 10;
  const bucketStartX = 15;
  const bucketTopY = 60;
  const bucketH = 32;
  const entryH = 28;
  const entryGap = 4;
</script>

<div class="space-y-6">
  <!-- Controls -->
  <div class="flex items-center gap-3 flex-wrap">
    <input
      type="text"
      bind:value={keyInput}
      placeholder="Key"
      disabled={running}
      class="px-3 py-1.5 text-sm rounded-lg border border-border bg-background w-24 focus:outline-none focus:ring-1 focus:ring-primary"
    />
    <input
      type="text"
      bind:value={valueInput}
      placeholder="Value"
      disabled={running}
      class="px-3 py-1.5 text-sm rounded-lg border border-border bg-background w-24 focus:outline-none focus:ring-1 focus:ring-primary"
    />
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={put}
      disabled={running || !keyInput.trim()}
    >
      Put
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={get}
      disabled={running || !keyInput.trim()}
    >
      Get
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={del}
      disabled={running || !keyInput.trim()}
    >
      Delete
    </button>
  </div>

  <div class="flex items-center gap-4 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={reset}
      disabled={running}
    >
      Reset
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={randomize}
      disabled={running}
    >
      Randomize
    </button>
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      Speed
      <input
        type="range"
        min="100"
        max="1000"
        step="100"
        bind:value={speed}
        disabled={running}
        class="w-24"
      />
    </label>
    <span class="text-sm text-muted-foreground font-mono">
      α = {loadFactor()} ({totalEntries()}/{NUM_BUCKETS})
    </span>
  </div>

  <!-- SVG Visualization -->
  <svg viewBox="0 0 550 400" class="w-full max-w-2xl mx-auto" role="img" aria-label="Hash map visualization">
    <!-- Hash computation display -->
    {#if hashingPhase === 'hashing'}
      <text x="275" y="25" text-anchor="middle" font-size="13" font-weight="600" fill="#facc15">
        Computing hash...
      </text>
    {/if}

    <!-- Bucket index labels -->
    {#each Array(NUM_BUCKETS) as _, i}
      {@const x = bucketStartX + i * (bucketW + bucketGap)}
      <text
        x={x + bucketW / 2} y={bucketTopY - 8}
        text-anchor="middle" font-size="11" fill="var(--muted-foreground)"
      >
        [{i}]
      </text>
    {/each}

    <!-- Buckets -->
    {#each buckets as chain, i}
      {@const x = bucketStartX + i * (bucketW + bucketGap)}

      <!-- Bucket header -->
      <rect
        {x} y={bucketTopY} width={bucketW} height={bucketH} rx="4"
        fill={bucketColor(i)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={x + bucketW / 2} y={bucketTopY + bucketH / 2 + 4}
        text-anchor="middle" font-size="10" font-weight="600" fill="var(--foreground)"
      >
        {chain.length === 0 ? 'empty' : `${chain.length} item${chain.length > 1 ? 's' : ''}`}
      </text>

      <!-- Chain entries -->
      {#each chain as entry, j}
        {@const ey = bucketTopY + bucketH + 6 + j * (entryH + entryGap)}

        <!-- Link arrow from bucket or previous entry -->
        <line
          x1={x + bucketW / 2}
          y1={j === 0 ? bucketTopY + bucketH : ey - entryGap}
          x2={x + bucketW / 2}
          y2={ey}
          stroke="var(--border)" stroke-width="1"
        />

        <!-- Entry rectangle -->
        <rect
          x={x + 2} y={ey} width={bucketW - 4} height={entryH} rx="3"
          fill={entryColor(entry, i)}
          stroke="var(--border)" stroke-width="1"
          class="transition-all duration-300"
        />
        <text
          x={x + bucketW / 2} y={ey + 11}
          text-anchor="middle" font-size="9" font-weight="600" fill="var(--foreground)"
        >
          {entry.key}
        </text>
        <text
          x={x + bucketW / 2} y={ey + 22}
          text-anchor="middle" font-size="8" fill="var(--muted-foreground)"
        >
          {entry.value}
        </text>
      {/each}

      <!-- Null terminator -->
      {#if chain.length > 0}
        {@const nullY = bucketTopY + bucketH + 6 + chain.length * (entryH + entryGap)}
        <text
          x={x + bucketW / 2} y={nullY + 4}
          text-anchor="middle" font-size="9" fill="var(--muted-foreground)"
        >
          ∅
        </text>
      {/if}
    {/each}
  </svg>

  <!-- Legend -->
  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: var(--muted)"></span> Empty</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #facc15"></span> Hashing</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #3b82f6"></span> Target bucket</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #22c55e"></span> Found / Inserted</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #ef4444"></span> Collision / Deleted</span>
  </div>

  <!-- Log -->
  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-48 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
