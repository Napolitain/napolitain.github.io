<script lang="ts">
  let arr = $state([4, 2, 6, 1, 8, 3, 5, 7]);
  let stack = $state<number[]>([]);
  let result = $state<(number | null)[]>(new Array(8).fill(null));
  let currentIdx = $state(-1);
  let poppingIndices = $state<number[]>([]);
  let resolvedIndices = $state<Set<number>>(new Set());
  let running = $state(false);
  let speed = $state(500);
  let log = $state<string[]>([]);

  // History for step back
  let history = $state<Array<{
    stack: number[];
    result: (number | null)[];
    currentIdx: number;
    resolvedIndices: Set<number>;
    log: string[];
  }>>([]);
  let stepMode = $state(false);
  let stepResolve: (() => void) | null = $state(null);

  const maxVal = $derived(Math.max(...arr));

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function waitForStep(): Promise<void> {
    return new Promise(resolve => { stepResolve = resolve; });
  }

  function saveSnapshot() {
    history = [...history, {
      stack: [...stack],
      result: [...result],
      currentIdx,
      resolvedIndices: new Set(resolvedIndices),
      log: [...log],
    }];
  }

  function reset() {
    stack = [];
    result = new Array(arr.length).fill(null);
    currentIdx = -1;
    poppingIndices = [];
    resolvedIndices = new Set();
    running = false;
    log = [];
    history = [];
    stepMode = false;
    stepResolve = null;
  }

  function randomize() {
    if (running) return;
    arr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 19) + 1);
    reset();
  }

  function stepBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    history = history.slice(0, -1);
    stack = prev.stack;
    result = prev.result;
    currentIdx = prev.currentIdx;
    poppingIndices = [];
    resolvedIndices = prev.resolvedIndices;
    log = prev.log;
  }

  function stepForward() {
    if (stepResolve) {
      const resolve = stepResolve;
      stepResolve = null;
      resolve();
    }
  }

  async function run(stepping: boolean) {
    reset();
    running = true;
    stepMode = stepping;

    async function pause(ms: number) {
      if (stepMode) {
        await waitForStep();
      } else {
        await sleep(ms);
      }
    }

    for (let i = 0; i < arr.length && running; i++) {
      saveSnapshot();
      currentIdx = i;
      poppingIndices = [];
      log = [...log, `Process arr[${i}] = ${arr[i]}`];
      await pause(speed);

      while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i] && running) {
        const topIdx = stack[stack.length - 1];
        poppingIndices = [topIdx];
        log = [...log, `  Pop idx ${topIdx} (${arr[topIdx]}) → NGE is ${arr[i]}`];
        await pause(speed);

        stack = stack.slice(0, -1);
        result[topIdx] = arr[i];
        result = [...result];
        resolvedIndices = new Set([...resolvedIndices, topIdx]);
        poppingIndices = [];
      }

      stack = [...stack, i];
      log = [...log, `  Push idx ${i} (${arr[i]}) → stack: [${stack.map(s => arr[s]).join(', ')}]`];
      await pause(speed * 0.6);
    }

    // Mark remaining stack elements as resolved with -1
    if (running) {
      for (const idx of stack) {
        result[idx] = -1;
        resolvedIndices = new Set([...resolvedIndices, idx]);
      }
      result = [...result];
      log = [...log, `Done. Remaining stack elements have no next greater element.`];
    }

    currentIdx = -1;
    poppingIndices = [];
    running = false;
    stepMode = false;
  }

  function barColor(i: number): string {
    if (poppingIndices.includes(i)) return '#ef4444';
    if (i === currentIdx) return '#3b82f6';
    if (stack.includes(i) && currentIdx >= 0) return '#facc15';
    if (resolvedIndices.has(i)) return '#22c55e';
    return 'var(--muted)';
  }

  function stackItemColor(idx: number): string {
    if (poppingIndices.includes(idx)) return '#ef4444';
    return '#facc15';
  }

  // SVG layout constants
  const barAreaW = 360;
  const barAreaX = 10;
  const barAreaY = 30;
  const barAreaH = 150;
  const stackX = 430;
  const stackW = 80;
  const resultY = 230;
</script>

<div class="space-y-4">
  <div class="flex items-center gap-3 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={() => run(false)}
      disabled={running}
    >
      {running && !stepMode ? 'Running...' : 'Run'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={() => run(true)}
      disabled={running}
    >
      Step
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepForward}
      disabled={!stepMode || !stepResolve}
    >
      Next →
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepBack}
      disabled={running && !stepMode || history.length === 0}
    >
      ← Back
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={randomize}
      disabled={running}
    >
      Randomize
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={reset}
      disabled={running && !stepMode}
    >
      Reset
    </button>
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      Speed
      <input
        type="range" min="100" max="1200" step="50"
        bind:value={speed}
        class="w-24"
        disabled={running}
      />
      <span class="tabular-nums w-14">{speed}ms</span>
    </label>
  </div>

  <svg viewBox="0 0 550 350" class="w-full max-w-2xl mx-auto" role="img" aria-label="Monotonic stack visualization for next greater element">
    <!-- Section labels -->
    <text x={barAreaX} y="18" font-size="11" font-weight="600" fill="var(--foreground)">Array</text>
    <text x={stackX} y="18" font-size="11" font-weight="600" fill="var(--foreground)">Stack</text>
    <text x={barAreaX} y={resultY - 8} font-size="11" font-weight="600" fill="var(--foreground)">Result (Next Greater Element)</text>

    <!-- Array bars -->
    {#each arr as val, i}
      {@const barW = (barAreaW - (arr.length - 1) * 6) / arr.length}
      {@const barH = (val / maxVal) * (barAreaH - 10)}
      {@const x = barAreaX + i * (barW + 6)}
      {@const y = barAreaY + barAreaH - barH}

      <rect
        {x} {y} width={barW} height={barH} rx="3"
        fill={barColor(i)}
        stroke="var(--border)" stroke-width="1"
        class="transition-all duration-300"
      />
      <text
        x={x + barW / 2} y={y - 4}
        text-anchor="middle" font-size="11" font-weight="600"
        fill="var(--foreground)"
      >
        {val}
      </text>
      <!-- Index below bar -->
      <text
        x={x + barW / 2} y={barAreaY + barAreaH + 14}
        text-anchor="middle" font-size="9"
        fill="var(--muted-foreground)"
      >
        [{i}]
      </text>
    {/each}

    <!-- Stack visualization (vertical, bottom-up) -->
    {#each stack as idx, si}
      {@const sy = barAreaY + barAreaH - si * 28 - 28}
      <rect
        x={stackX} y={sy} width={stackW} height="24" rx="4"
        fill={stackItemColor(idx)}
        stroke="var(--border)" stroke-width="1"
        class="transition-all duration-200"
      />
      <text
        x={stackX + stackW / 2} y={sy + 16}
        text-anchor="middle" font-size="11" font-weight="600"
        fill="#18181b"
      >
        {arr[idx]} [i={idx}]
      </text>
    {/each}

    <!-- Stack base -->
    <line
      x1={stackX - 4} y1={barAreaY + barAreaH + 2}
      x2={stackX + stackW + 4} y2={barAreaY + barAreaH + 2}
      stroke="var(--border)" stroke-width="2"
    />
    {#if stack.length === 0 && currentIdx >= 0}
      <text
        x={stackX + stackW / 2} y={barAreaY + barAreaH - 10}
        text-anchor="middle" font-size="10" fill="var(--muted-foreground)"
      >
        empty
      </text>
    {/if}

    <!-- Result boxes -->
    {#each arr as _, i}
      {@const boxW = (barAreaW - (arr.length - 1) * 6) / arr.length}
      {@const x = barAreaX + i * (boxW + 6)}

      <rect
        {x} y={resultY} width={boxW} height="28" rx="4"
        fill={result[i] !== null ? (result[i] === -1 ? 'var(--muted)' : '#22c55e') : 'var(--muted)'}
        stroke="var(--border)" stroke-width="1"
        opacity={result[i] !== null ? 1 : 0.4}
        class="transition-all duration-300"
      />
      <text
        x={x + boxW / 2} y={resultY + 18}
        text-anchor="middle" font-size="11" font-weight="600"
        fill={result[i] !== null ? 'var(--foreground)' : 'var(--muted-foreground)'}
      >
        {result[i] !== null ? result[i] : '—'}
      </text>
      <text
        x={x + boxW / 2} y={resultY + 44}
        text-anchor="middle" font-size="9"
        fill="var(--muted-foreground)"
      >
        [{i}]
      </text>
    {/each}

    <!-- Legend -->
    {#each [
      { color: 'var(--muted)', label: 'Unprocessed' },
      { color: '#3b82f6', label: 'Current' },
      { color: '#ef4444', label: 'Popping' },
      { color: '#facc15', label: 'In Stack' },
      { color: '#22c55e', label: 'Resolved' },
    ] as item, li}
      {@const lx = barAreaX + li * 105}
      <rect x={lx} y="300" width="12" height="12" rx="2" fill={item.color} stroke="var(--border)" stroke-width="0.5" />
      <text x={lx + 16} y="310" font-size="10" fill="var(--muted-foreground)">{item.label}</text>
    {/each}
  </svg>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
