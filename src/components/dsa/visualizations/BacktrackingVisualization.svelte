<script lang="ts">
  const N = 6;
  const CELL = 60;
  const BOARD = N * CELL;
  const PAD = (400 - BOARD) / 2;

  type CellState = 'empty' | 'placing' | 'conflict' | 'placed' | 'backtracking' | 'threatened';

  let board: CellState[][] = $state(makeEmptyBoard());
  let queens: number[] = $state(Array(N).fill(-1));
  let currentRow = $state(-1);
  let solutionCount = $state(0);
  let running = $state(false);
  let log: string[] = $state([]);
  let speed = $state(300);
  let history: { board: CellState[][]; queens: number[]; currentRow: number; solutionCount: number; log: string[] }[] = $state([]);
  let historyIndex = $state(-1);
  let stepping = $state(false);
  let cancelled = $state(false);

  function makeEmptyBoard(): CellState[][] {
    return Array.from({ length: N }, () => Array(N).fill('empty'));
  }

  function reset() {
    cancelled = true;
    running = false;
    stepping = false;
    board = makeEmptyBoard();
    queens = Array(N).fill(-1);
    currentRow = -1;
    solutionCount = 0;
    log = [];
    history = [];
    historyIndex = -1;
    cancelled = false;
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function snapshot() {
    history = [...history.slice(0, historyIndex + 1), {
      board: board.map(r => [...r]),
      queens: [...queens],
      currentRow,
      solutionCount,
      log: [...log],
    }];
    historyIndex = history.length - 1;
  }

  function restoreSnapshot(idx: number) {
    if (idx < 0 || idx >= history.length) return;
    historyIndex = idx;
    const snap = history[idx];
    board = snap.board.map(r => [...r]);
    queens = [...snap.queens];
    currentRow = snap.currentRow;
    solutionCount = snap.solutionCount;
    log = [...snap.log];
  }

  function stepBack() {
    if (historyIndex > 0) restoreSnapshot(historyIndex - 1);
  }

  function stepForward() {
    if (historyIndex < history.length - 1) restoreSnapshot(historyIndex + 1);
  }

  function isThreatened(row: number, col: number, placedQueens: number[]): boolean {
    for (let r = 0; r < N; r++) {
      const c = placedQueens[r];
      if (c === -1) continue;
      if (c === col) return true;
      if (Math.abs(r - row) === Math.abs(c - col)) return true;
    }
    return false;
  }

  function markThreats(placedQueens: number[]) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c] === 'empty' || board[r][c] === 'threatened') {
          board[r][c] = isThreatened(r, c, placedQueens) ? 'threatened' : 'empty';
        }
      }
    }
  }

  async function solve() {
    reset();
    await sleep(50);
    running = true;
    cancelled = false;
    log = ['Starting N-Queens solver (N=6)...'];
    snapshot();
    await backtrack(0);
    if (!cancelled) {
      log = [...log, `Done. Found ${solutionCount} solution(s).`];
      snapshot();
    }
    running = false;
  }

  async function backtrack(row: number): Promise<void> {
    if (cancelled) return;

    if (row === N) {
      solutionCount++;
      log = [...log, `✓ Solution #${solutionCount} found!`];
      snapshot();
      await sleep(speed * 3);
      return;
    }

    currentRow = row;

    for (let col = 0; col < N; col++) {
      if (cancelled) return;

      // Try placing
      board[row][col] = 'placing';
      markThreats(queens);
      log = [...log, `Try queen at (${row}, ${col})`];
      snapshot();
      await sleep(speed);

      if (cancelled) return;

      if (isThreatened(row, col, queens)) {
        // Conflict
        board[row][col] = 'conflict';
        log = [...log, `✗ Conflict at (${row}, ${col})!`];
        snapshot();
        await sleep(speed);
        board[row][col] = 'empty';
        markThreats(queens);
        continue;
      }

      // Place queen
      queens[row] = col;
      board[row][col] = 'placed';
      markThreats(queens);
      log = [...log, `Place queen at (${row}, ${col})`];
      snapshot();
      await sleep(speed);

      await backtrack(row + 1);

      if (cancelled) return;

      // Backtrack
      queens[row] = -1;
      board[row][col] = 'backtracking';
      markThreats(queens);
      log = [...log, `Backtrack from (${row}, ${col})`];
      snapshot();
      await sleep(speed);
      board[row][col] = 'empty';
      markThreats(queens);
    }

    currentRow = row - 1;
  }

  const stateColors: Record<CellState, string> = {
    empty: 'var(--muted)',
    placing: '#3b82f6',
    conflict: '#ef4444',
    placed: '#22c55e',
    backtracking: '#facc15',
    threatened: 'var(--muted)',
  };

  function cellFill(r: number, c: number): string {
    return stateColors[board[r][c]];
  }

  function cellOpacity(r: number, c: number): number {
    const isDark = (r + c) % 2 === 1;
    if (board[r][c] === 'threatened') return isDark ? 0.5 : 0.35;
    if (board[r][c] === 'empty') return isDark ? 0.7 : 0.4;
    return 1;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center gap-3">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={solve}
      disabled={running}
    >
      {running ? 'Solving...' : 'Solve'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={reset}
    >
      Reset
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepBack}
      disabled={running || historyIndex <= 0}
      title="Step back"
    >
      ◀
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepForward}
      disabled={running || historyIndex >= history.length - 1}
      title="Step forward"
    >
      ▶
    </button>
    <div class="flex items-center gap-2 text-sm">
      <label for="speed-slider" class="text-muted-foreground">Speed:</label>
      <input
        id="speed-slider"
        type="range"
        min="50"
        max="800"
        step="50"
        bind:value={speed}
        class="w-24 accent-primary"
      />
      <span class="text-muted-foreground w-14 text-right">{speed}ms</span>
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-4 text-sm">
    {#if currentRow >= 0}
      <span class="font-mono"><span class="text-muted-foreground">Row:</span> {currentRow}</span>
    {/if}
    <span class="font-mono"><span class="text-muted-foreground">Solutions:</span> {solutionCount}</span>
  </div>

  <svg viewBox="0 0 400 400" class="w-full max-w-md mx-auto" role="img" aria-label="N-Queens backtracking visualization">
    {#each { length: N } as _, r}
      {#each { length: N } as _, c}
        {@const x = PAD + c * CELL}
        {@const y = PAD + r * CELL}
        <rect
          {x} {y}
          width={CELL}
          height={CELL}
          fill={cellFill(r, c)}
          opacity={cellOpacity(r, c)}
          stroke="var(--border)"
          stroke-width="1"
          class="transition-all duration-200"
        />
        {#if board[r][c] === 'threatened'}
          <line
            x1={x + CELL * 0.3} y1={y + CELL * 0.3}
            x2={x + CELL * 0.7} y2={y + CELL * 0.7}
            stroke="#ef4444" stroke-width="1.5" opacity="0.4"
          />
          <line
            x1={x + CELL * 0.7} y1={y + CELL * 0.3}
            x2={x + CELL * 0.3} y2={y + CELL * 0.7}
            stroke="#ef4444" stroke-width="1.5" opacity="0.4"
          />
        {/if}
        {#if queens[r] === c || board[r][c] === 'placing' || board[r][c] === 'conflict' || board[r][c] === 'backtracking'}
          <circle
            cx={x + CELL / 2}
            cy={y + CELL / 2}
            r={CELL * 0.32}
            fill={stateColors[board[r][c]]}
            stroke="var(--foreground)"
            stroke-width="1.5"
            class="transition-all duration-200"
          />
          <text
            x={x + CELL / 2}
            y={y + CELL / 2 + 5}
            text-anchor="middle"
            font-size="18"
            fill="var(--foreground)"
          >♛</text>
        {/if}
      {/each}
    {/each}
    {#if currentRow >= 0 && currentRow < N}
      <rect
        x={PAD - 2}
        y={PAD + currentRow * CELL - 2}
        width={N * CELL + 4}
        height={CELL + 4}
        fill="none"
        stroke="#3b82f6"
        stroke-width="2"
        stroke-dasharray="6 3"
        rx="2"
        class="transition-all duration-200"
      />
    {/if}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[var(--muted)] border border-border"></span> Empty</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Trying</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500"></span> Conflict</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Placed</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-yellow-400"></span> Backtracking</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-48 overflow-y-auto">
      {#each log.slice(-20) as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
