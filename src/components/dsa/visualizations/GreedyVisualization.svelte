<script lang="ts">
  import { onMount } from 'svelte';

  type IntervalState = 'unprocessed' | 'considering' | 'selected' | 'rejected';

  interface Interval {
    id: number;
    start: number;
    end: number;
    state: IntervalState;
  }

  const defaultIntervals: [number, number][] = [
    [1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11],
  ];

  let intervals: Interval[] = $state([]);
  let running = $state(false);
  let selectedCount = $state(0);
  let speed = $state(600);
  let history: Interval[][] = $state([]);
  let historyIndex = $state(-1);
  let done = $state(false);

  const stateColors: Record<IntervalState, string> = {
    unprocessed: 'var(--muted)',
    considering: '#facc15',
    selected: '#22c55e',
    rejected: '#ef4444',
  };

  function makeIntervals(raw: [number, number][]): Interval[] {
    return raw.map((iv, i) => ({ id: i, start: iv[0], end: iv[1], state: 'unprocessed' as IntervalState }));
  }

  function clone(ivs: Interval[]): Interval[] {
    return ivs.map(iv => ({ ...iv }));
  }

  function reset() {
    intervals = makeIntervals(defaultIntervals);
    running = false;
    selectedCount = 0;
    history = [clone(intervals)];
    historyIndex = 0;
    done = false;
  }

  onMount(reset);

  function randomize() {
    if (running) return;
    const count = 7 + Math.floor(Math.random() * 3);
    const raw: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const s = Math.floor(Math.random() * 9);
      const e = s + 1 + Math.floor(Math.random() * (11 - s - 1));
      raw.push([s, Math.min(e, 11)]);
    }
    intervals = makeIntervals(raw);
    selectedCount = 0;
    history = [clone(intervals)];
    historyIndex = 0;
    done = false;
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function pushHistory() {
    // Trim any forward history if we branched
    history = [...history.slice(0, historyIndex + 1), clone(intervals)];
    historyIndex = history.length - 1;
  }

  async function runGreedy() {
    reset();
    running = true;

    // Sort by end time
    intervals = [...intervals].sort((a, b) => a.end - b.end);
    pushHistory();
    await sleep(speed);

    let lastEnd = -Infinity;

    for (let i = 0; i < intervals.length; i++) {
      if (!running) return;

      intervals[i].state = 'considering';
      intervals = [...intervals];
      pushHistory();
      await sleep(speed);

      if (!running) return;

      if (intervals[i].start >= lastEnd) {
        intervals[i].state = 'selected';
        lastEnd = intervals[i].end;
        selectedCount++;
      } else {
        intervals[i].state = 'rejected';
      }

      intervals = [...intervals];
      pushHistory();
      await sleep(speed * 0.7);
    }

    running = false;
    done = true;
  }

  function stepBack() {
    if (historyIndex <= 0 || running) return;
    historyIndex--;
    intervals = clone(history[historyIndex]);
    selectedCount = intervals.filter(iv => iv.state === 'selected').length;
    done = false;
  }

  function stepForward() {
    if (historyIndex >= history.length - 1 || running) return;
    historyIndex++;
    intervals = clone(history[historyIndex]);
    selectedCount = intervals.filter(iv => iv.state === 'selected').length;
    done = historyIndex === history.length - 1 && intervals.every(iv => iv.state !== 'unprocessed' && iv.state !== 'considering');
  }

  // Timeline constants
  const timeMin = 0;
  const timeMax = 11;
  const marginLeft = 40;
  const marginRight = 20;
  const marginTop = 20;
  const barHeight = 24;
  const barGap = 6;
  const timelineY = 320;
  const chartWidth = 500 - marginLeft - marginRight;

  function timeToX(t: number): number {
    return marginLeft + (t - timeMin) / (timeMax - timeMin) * chartWidth;
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-3 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={runGreedy}
      disabled={running || done}
    >
      {running ? 'Running...' : 'Run Greedy'}
    </button>
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
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepBack}
      disabled={running || historyIndex <= 0}
      aria-label="Step back"
    >
      ◀
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepForward}
      disabled={running || historyIndex >= history.length - 1}
      aria-label="Step forward"
    >
      ▶
    </button>
    <label class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">Speed:</span>
      <input
        type="range"
        min="200"
        max="1200"
        step="100"
        bind:value={speed}
        class="w-20"
        disabled={running}
      />
    </label>
  </div>

  <svg viewBox="0 0 500 350" class="w-full max-w-xl mx-auto" role="img" aria-label="Greedy interval scheduling visualization">
    <!-- Interval bars -->
    {#each intervals as iv, i}
      {@const x1 = timeToX(iv.start)}
      {@const x2 = timeToX(iv.end)}
      {@const y = marginTop + i * (barHeight + barGap)}
      <rect
        x={x1}
        y={y}
        width={x2 - x1}
        height={barHeight}
        rx="4"
        fill={stateColors[iv.state]}
        stroke="var(--border)"
        stroke-width="1.5"
        class="transition-all duration-300"
      />
      <text
        x={(x1 + x2) / 2}
        y={y + barHeight / 2 + 1}
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="10"
        font-weight="600"
        fill="var(--foreground)"
      >
        [{iv.start}, {iv.end})
      </text>
    {/each}

    <!-- Timeline axis -->
    <line
      x1={marginLeft}
      y1={timelineY}
      x2={marginLeft + chartWidth}
      y2={timelineY}
      stroke="var(--border)"
      stroke-width="1.5"
    />
    {#each Array.from({ length: timeMax - timeMin + 1 }, (_, i) => timeMin + i) as t}
      {@const x = timeToX(t)}
      <line x1={x} y1={timelineY - 4} x2={x} y2={timelineY + 4} stroke="var(--border)" stroke-width="1" />
      <text
        x={x}
        y={timelineY + 16}
        text-anchor="middle"
        font-size="10"
        fill="var(--muted-foreground)"
      >
        {t}
      </text>
    {/each}
  </svg>

  <div class="flex flex-wrap items-center gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border border-border" style="background: var(--muted)"></span> Unprocessed</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #facc15"></span> Considering</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #22c55e"></span> Selected</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background: #ef4444"></span> Rejected</span>
    <span class="ml-auto font-mono text-muted-foreground">Selected {selectedCount} interval{selectedCount !== 1 ? 's' : ''}</span>
  </div>
</div>
