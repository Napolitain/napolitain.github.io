<script lang="ts">
  const N = 8;
  const TREE_SIZE = 4 * N;

  type NodeState = 'idle' | 'visiting' | 'contributing' | 'updated';

  let arr = $state<number[]>([3, 1, 4, 1, 5, 9, 2, 6]);
  let tree = $state<number[]>(new Array(TREE_SIZE).fill(0));
  let nodeState = $state<NodeState[]>(new Array(TREE_SIZE).fill('idle'));
  let built = $state(false);
  let running = $state(false);
  let message = $state('Press Build to construct the segment tree.');
  let result = $state<string | null>(null);
  let speed = $state(400);
  let queryL = $state(2);
  let queryR = $state(5);
  let updateIdx = $state(3);
  let updateVal = $state(7);

  // History for step navigation
  let history = $state<{ tree: number[]; nodeState: NodeState[]; message: string; result: string | null }[]>([]);
  let historyPos = $state(-1);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clearStates() {
    nodeState = new Array(TREE_SIZE).fill('idle');
  }

  function snapshot(msg?: string) {
    const entry = {
      tree: [...tree],
      nodeState: [...nodeState],
      message: msg ?? message,
      result: result,
    };
    history = [...history.slice(0, historyPos + 1), entry];
    historyPos = history.length - 1;
  }

  function stepBack() {
    if (historyPos > 0) {
      historyPos--;
      const s = history[historyPos];
      tree = [...s.tree];
      nodeState = [...s.nodeState];
      message = s.message;
      result = s.result;
    }
  }

  function stepForward() {
    if (historyPos < history.length - 1) {
      historyPos++;
      const s = history[historyPos];
      tree = [...s.tree];
      nodeState = [...s.nodeState];
      message = s.message;
      result = s.result;
    }
  }

  // --- Segment tree core ---
  function buildTree(node: number, start: number, end: number) {
    if (start === end) {
      tree[node] = arr[start];
      return;
    }
    const mid = Math.floor((start + end) / 2);
    buildTree(2 * node, start, mid);
    buildTree(2 * node + 1, mid + 1, end);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
  }

  // --- Animated build ---
  async function animatedBuild() {
    running = true;
    result = null;
    history = [];
    historyPos = -1;
    tree = new Array(TREE_SIZE).fill(0);
    clearStates();
    message = 'Building segment tree from array...';
    snapshot();

    async function buildRec(node: number, start: number, end: number) {
      nodeState[node] = 'visiting';
      nodeState = [...nodeState];
      message = `Building node ${node}: range [${start}, ${end}]`;
      snapshot();
      await sleep(speed);

      if (start === end) {
        tree[node] = arr[start];
        tree = [...tree];
        nodeState[node] = 'contributing';
        nodeState = [...nodeState];
        message = `Leaf node ${node} = arr[${start}] = ${arr[start]}`;
        snapshot();
        await sleep(speed * 0.6);
        nodeState[node] = 'idle';
        nodeState = [...nodeState];
        return;
      }
      const mid = Math.floor((start + end) / 2);
      await buildRec(2 * node, start, mid);
      await buildRec(2 * node + 1, mid + 1, end);

      tree[node] = tree[2 * node] + tree[2 * node + 1];
      tree = [...tree];
      nodeState[node] = 'contributing';
      nodeState = [...nodeState];
      message = `Node ${node} = ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}`;
      snapshot();
      await sleep(speed * 0.6);
      nodeState[node] = 'idle';
      nodeState = [...nodeState];
    }

    await buildRec(1, 0, N - 1);
    clearStates();
    built = true;
    message = 'Segment tree built. Try a query or update.';
    snapshot();
    running = false;
  }

  // --- Animated query ---
  async function animatedQuery() {
    if (!built) return;
    running = true;
    clearStates();
    history = [];
    historyPos = -1;
    result = null;
    const L = queryL, R = queryR;
    message = `Query sum(${L}, ${R}) = ?`;
    snapshot();

    async function queryRec(node: number, start: number, end: number, l: number, r: number): Promise<number> {
      if (r < start || end < l) {
        nodeState[node] = 'visiting';
        nodeState = [...nodeState];
        message = `Node ${node} [${start},${end}] — no overlap, skip`;
        snapshot();
        await sleep(speed * 0.5);
        nodeState[node] = 'idle';
        nodeState = [...nodeState];
        return 0;
      }
      if (l <= start && end <= r) {
        nodeState[node] = 'contributing';
        nodeState = [...nodeState];
        message = `Node ${node} [${start},${end}] fully in [${l},${r}] → contributes ${tree[node]}`;
        snapshot();
        await sleep(speed);
        return tree[node];
      }
      nodeState[node] = 'visiting';
      nodeState = [...nodeState];
      message = `Node ${node} [${start},${end}] — partial overlap, recurse`;
      snapshot();
      await sleep(speed * 0.6);

      const mid = Math.floor((start + end) / 2);
      const left = await queryRec(2 * node, start, mid, l, r);
      const right = await queryRec(2 * node + 1, mid + 1, end, l, r);
      nodeState[node] = 'idle';
      nodeState = [...nodeState];
      return left + right;
    }

    const ans = await queryRec(1, 0, N - 1, L, R);
    clearStates();
    result = `sum(${L}, ${R}) = ${ans}`;
    message = `Query complete: ${result}`;
    snapshot();
    running = false;
  }

  // --- Animated update ---
  async function animatedUpdate() {
    if (!built) return;
    running = true;
    clearStates();
    history = [];
    historyPos = -1;
    result = null;
    const idx = updateIdx, val = updateVal;
    arr[idx] = val;
    arr = [...arr];
    message = `Update arr[${idx}] = ${val}`;
    snapshot();

    async function updateRec(node: number, start: number, end: number) {
      nodeState[node] = 'visiting';
      nodeState = [...nodeState];
      message = `Visiting node ${node} [${start},${end}]`;
      snapshot();
      await sleep(speed * 0.6);

      if (start === end) {
        tree[node] = val;
        tree = [...tree];
        nodeState[node] = 'updated';
        nodeState = [...nodeState];
        message = `Leaf node ${node} updated to ${val}`;
        snapshot();
        await sleep(speed);
        return;
      }
      const mid = Math.floor((start + end) / 2);
      if (idx <= mid) {
        await updateRec(2 * node, start, mid);
      } else {
        await updateRec(2 * node + 1, mid + 1, end);
      }

      tree[node] = tree[2 * node] + tree[2 * node + 1];
      tree = [...tree];
      nodeState[node] = 'updated';
      nodeState = [...nodeState];
      message = `Node ${node} recalculated: ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}`;
      snapshot();
      await sleep(speed);
    }

    await updateRec(1, 0, N - 1);
    clearStates();
    message = `Update complete. arr[${idx}] = ${val}`;
    result = `Updated index ${idx} to ${val}`;
    snapshot();
    running = false;
  }

  function randomize() {
    arr = Array.from({ length: N }, () => Math.floor(Math.random() * 20) + 1);
    tree = new Array(TREE_SIZE).fill(0);
    clearStates();
    built = false;
    result = null;
    history = [];
    historyPos = -1;
    message = 'Array randomized. Press Build.';
  }

  function reset() {
    arr = [3, 1, 4, 1, 5, 9, 2, 6];
    tree = new Array(TREE_SIZE).fill(0);
    clearStates();
    built = false;
    running = false;
    result = null;
    history = [];
    historyPos = -1;
    message = 'Press Build to construct the segment tree.';
  }

  // --- Layout helpers ---
  // Nodes that exist in a tree for N=8: indices 1..15
  const ACTIVE_NODES = Array.from({ length: 15 }, (_, i) => i + 1);

  // Range each node covers (direct computation, no recursion)
  function nodeRange(node: number): [number, number] {
    const depth = Math.floor(Math.log2(node));
    const posInLevel = node - Math.pow(2, depth);
    const segSize = N / Math.pow(2, depth);
    const start = posInLevel * segSize;
    return [start, start + segSize - 1];
  }

  function nodePos(node: number): { x: number; y: number } {
    const depth = Math.floor(Math.log2(node));
    const posInLevel = node - Math.pow(2, depth);
    const levelCount = Math.pow(2, depth);
    const xPad = 30;
    const usable = 600 - 2 * xPad;
    const spacing = usable / levelCount;
    return {
      x: xPad + spacing * posInLevel + spacing / 2,
      y: 30 + depth * 70,
    };
  }

  function stateColor(state: NodeState): string {
    switch (state) {
      case 'visiting': return '#3b82f6';
      case 'contributing': return '#22c55e';
      case 'updated': return '#facc15';
      default: return 'var(--muted)';
    }
  }
</script>

<div class="space-y-4">
  <!-- Controls row 1: main actions -->
  <div class="flex items-center gap-3 flex-wrap">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={animatedBuild}
      disabled={running}
    >
      Build
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={animatedQuery}
      disabled={running || !built}
    >
      Query
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={animatedUpdate}
      disabled={running || !built}
    >
      Update
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={randomize}
      disabled={running}
    >
      Randomize
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <!-- Controls row 2: parameters -->
  <div class="flex items-center gap-4 flex-wrap text-sm">
    <label class="flex items-center gap-1.5">
      Query L:
      <input type="number" min="0" max={N - 1} bind:value={queryL}
        class="w-14 px-1.5 py-1 rounded border border-border bg-background text-foreground text-center" />
    </label>
    <label class="flex items-center gap-1.5">
      R:
      <input type="number" min="0" max={N - 1} bind:value={queryR}
        class="w-14 px-1.5 py-1 rounded border border-border bg-background text-foreground text-center" />
    </label>
    <span class="text-muted-foreground">|</span>
    <label class="flex items-center gap-1.5">
      Update idx:
      <input type="number" min="0" max={N - 1} bind:value={updateIdx}
        class="w-14 px-1.5 py-1 rounded border border-border bg-background text-foreground text-center" />
    </label>
    <label class="flex items-center gap-1.5">
      val:
      <input type="number" min="0" max="99" bind:value={updateVal}
        class="w-14 px-1.5 py-1 rounded border border-border bg-background text-foreground text-center" />
    </label>
  </div>

  <!-- Controls row 3: step & speed -->
  <div class="flex items-center gap-4 flex-wrap text-sm">
    <button
      class="px-3 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer"
      onclick={stepBack}
      disabled={running || historyPos <= 0}
    >
      ◀ Step Back
    </button>
    <button
      class="px-3 py-1 text-xs rounded border border-border hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer"
      onclick={stepForward}
      disabled={running || historyPos >= history.length - 1}
    >
      Step Forward ▶
    </button>
    <label class="flex items-center gap-1.5">
      Speed:
      <input type="range" min="100" max="1000" step="50" bind:value={speed}
        class="w-24 accent-primary" />
      <span class="text-muted-foreground w-12 text-right">{speed}ms</span>
    </label>
  </div>

  <!-- Status -->
  <div class="text-sm font-mono text-muted-foreground">{message}</div>
  {#if result}
    <div class="text-sm font-semibold font-mono text-green-500">{result}</div>
  {/if}

  <!-- SVG visualization -->
  <svg viewBox="0 0 600 400" class="w-full max-w-2xl mx-auto" role="img" aria-label="Segment tree visualization">
    <!-- Edges -->
    {#each ACTIVE_NODES as node}
      {#if node > 1 && tree[node] !== undefined}
        {@const parentNode = Math.floor(node / 2)}
        {@const pPos = nodePos(parentNode)}
        {@const cPos = nodePos(node)}
        <line
          x1={pPos.x} y1={pPos.y + 14} x2={cPos.x} y2={cPos.y - 14}
          stroke="var(--border)" stroke-width="1.2"
        />
      {/if}
    {/each}

    <!-- Tree nodes -->
    {#each ACTIVE_NODES as node}
      {@const pos = nodePos(node)}
      {@const range = nodeRange(node)}
      {@const color = stateColor(nodeState[node])}
      <rect
        x={pos.x - 26} y={pos.y - 14} width="52" height="28" rx="6"
        fill={color}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-300"
      />
      <!-- Range label -->
      <text
        x={pos.x} y={pos.y - 3}
        text-anchor="middle" font-size="8" fill="var(--foreground)" opacity="0.7"
      >
        [{range[0]},{range[1]}]
      </text>
      <!-- Value -->
      <text
        x={pos.x} y={pos.y + 10}
        text-anchor="middle" font-size="11" font-weight="700" fill="var(--foreground)"
      >
        {built || tree[node] ? tree[node] : ''}
      </text>
    {/each}

    <!-- Separator line -->
    <line x1="20" y1="320" x2="580" y2="320" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4" />

    <!-- Array at bottom -->
    {#each arr as val, i}
      {@const cx = 30 + (600 - 60) / N * i + (600 - 60) / N / 2}
      <rect
        x={cx - 25} y="340" width="50" height="36" rx="4"
        fill="var(--muted)" stroke="var(--border)" stroke-width="1"
      />
      <text
        x={cx} y="353"
        text-anchor="middle" font-size="8" fill="var(--foreground)" opacity="0.6"
      >
        [{i}]
      </text>
      <text
        x={cx} y="368"
        text-anchor="middle" font-size="13" font-weight="600" fill="var(--foreground)"
      >
        {val}
      </text>
    {/each}
  </svg>

  <!-- Legend -->
  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded" style="background: var(--muted); border: 1px solid var(--border)"></span> Idle
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded bg-blue-500"></span> Visiting
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded bg-green-500"></span> Contributing
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded bg-yellow-400"></span> Updated
    </span>
  </div>
</div>
