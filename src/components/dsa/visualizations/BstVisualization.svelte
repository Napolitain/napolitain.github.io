<script lang="ts">
  interface BstNode {
    val: number;
    left: BstNode | null;
    right: BstNode | null;
  }

  const DEFAULT_VALUES = [50, 30, 70, 20, 40, 60, 80];

  let root: BstNode | null = $state(null);
  let nodeStates: Record<number, string> = $state({});
  let running = $state(false);
  let log: string[] = $state([]);
  let inputVal = $state('');
  let speed = $state(500);
  let history: { root: BstNode | null; nodeStates: Record<number, string>; log: string[] }[] = $state([]);
  let historyIdx = $state(-1);

  function cloneTree(node: BstNode | null): BstNode | null {
    if (!node) return null;
    return { val: node.val, left: cloneTree(node.left), right: cloneTree(node.right) };
  }

  function pushHistory() {
    history = [...history.slice(0, historyIdx + 1), { root: cloneTree(root), nodeStates: { ...nodeStates }, log: [...log] }];
    historyIdx = history.length - 1;
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function insertNode(node: BstNode | null, val: number): BstNode {
    if (!node) return { val, left: null, right: null };
    if (val < node.val) node.left = insertNode(node.left, val);
    else if (val > node.val) node.right = insertNode(node.right, val);
    return node;
  }

  function collectValues(node: BstNode | null): number[] {
    if (!node) return [];
    return [...collectValues(node.left), node.val, ...collectValues(node.right)];
  }

  // Calculate positions using inorder index for x and depth for y
  function computePositions(node: BstNode | null): Map<number, { x: number; y: number }> {
    const positions = new Map<number, { x: number; y: number }>();
    let index = 0;
    const values = collectValues(node);
    const count = values.length;
    if (count === 0) return positions;

    function traverse(n: BstNode | null, depth: number) {
      if (!n) return;
      traverse(n.left, depth + 1);
      const xPad = 30;
      const xRange = 500 - 2 * xPad;
      const x = xPad + (index / Math.max(count - 1, 1)) * xRange;
      const y = 35 + depth * 65;
      positions.set(n.val, { x, y });
      index++;
      traverse(n.right, depth + 1);
    }
    traverse(node, 0);
    return positions;
  }

  function getEdges(node: BstNode | null): { from: number; to: number }[] {
    if (!node) return [];
    const edges: { from: number; to: number }[] = [];
    if (node.left) {
      edges.push({ from: node.val, to: node.left.val });
      edges.push(...getEdges(node.left));
    }
    if (node.right) {
      edges.push({ from: node.val, to: node.right.val });
      edges.push(...getEdges(node.right));
    }
    return edges;
  }

  let positions = $derived(computePositions(root));
  let edges = $derived(getEdges(root));

  function buildInitial() {
    root = null;
    nodeStates = {};
    log = [];
    history = [];
    historyIdx = -1;
    for (const v of DEFAULT_VALUES) {
      root = insertNode(root, v);
    }
    pushHistory();
  }

  // Init on mount equivalent via $effect
  let mounted = $state(false);
  $effect(() => {
    if (!mounted) {
      mounted = true;
      buildInitial();
    }
  });

  function reset() {
    running = false;
    buildInitial();
  }

  function randomize() {
    if (running) return;
    root = null;
    nodeStates = {};
    log = [];
    history = [];
    historyIdx = -1;
    const count = 7 + Math.floor(Math.random() * 4);
    const vals = new Set<number>();
    while (vals.size < count) {
      vals.add(Math.floor(Math.random() * 99) + 1);
    }
    for (const v of vals) {
      root = insertNode(root, v);
    }
    log = [`Tree built with values: [${collectValues(root).join(', ')}]`];
    pushHistory();
  }

  async function animateInsert() {
    const val = parseInt(inputVal);
    if (isNaN(val) || running) return;
    running = true;
    nodeStates = {};
    log = [...log, `Insert ${val}`];

    let node = root;
    while (node) {
      nodeStates = { ...nodeStates, [node.val]: 'comparing' };
      pushHistory();
      await sleep(speed);
      if (val === node.val) {
        nodeStates = { ...nodeStates, [node.val]: 'found' };
        log = [...log, `${val} already exists`];
        pushHistory();
        await sleep(speed);
        nodeStates = {};
        running = false;
        return;
      }
      nodeStates = { ...nodeStates, [node.val]: 'current' };
      await sleep(speed / 2);
      if (val < node.val) {
        log = [...log, `${val} < ${node.val}, go left`];
        node = node.left;
      } else {
        log = [...log, `${val} > ${node.val}, go right`];
        node = node.right;
      }
    }

    root = insertNode(root, val);
    nodeStates = { [val]: 'found' };
    log = [...log, `Inserted ${val}`];
    pushHistory();
    await sleep(speed);
    nodeStates = {};
    running = false;
  }

  async function animateSearch() {
    const val = parseInt(inputVal);
    if (isNaN(val) || running) return;
    running = true;
    nodeStates = {};
    log = [...log, `Search ${val}`];

    let node = root;
    while (node) {
      nodeStates = { ...nodeStates, [node.val]: 'comparing' };
      pushHistory();
      await sleep(speed);
      if (val === node.val) {
        nodeStates = { ...nodeStates, [node.val]: 'found' };
        log = [...log, `Found ${val}!`];
        pushHistory();
        await sleep(speed);
        nodeStates = {};
        running = false;
        return;
      }
      nodeStates = { ...nodeStates, [node.val]: 'current' };
      await sleep(speed / 2);
      if (val < node.val) {
        log = [...log, `${val} < ${node.val}, go left`];
        node = node.left;
      } else {
        log = [...log, `${val} > ${node.val}, go right`];
        node = node.right;
      }
    }

    nodeStates = {};
    log = [...log, `${val} not found`];
    pushHistory();
    await sleep(speed);
    running = false;
  }

  function deleteNode(node: BstNode | null, val: number): BstNode | null {
    if (!node) return null;
    if (val < node.val) { node.left = deleteNode(node.left, val); return node; }
    if (val > node.val) { node.right = deleteNode(node.right, val); return node; }
    if (!node.left && !node.right) return null;
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let succ = node.right;
    while (succ.left) succ = succ.left;
    node.val = succ.val;
    node.right = deleteNode(node.right, succ.val);
    return node;
  }

  async function animateDelete() {
    const val = parseInt(inputVal);
    if (isNaN(val) || running) return;
    running = true;
    nodeStates = {};
    log = [...log, `Delete ${val}`];

    let node = root;
    while (node) {
      nodeStates = { ...nodeStates, [node.val]: 'comparing' };
      pushHistory();
      await sleep(speed);
      if (val === node.val) {
        nodeStates = { ...nodeStates, [node.val]: 'deleted' };
        log = [...log, `Found ${val}, deleting...`];
        pushHistory();
        await sleep(speed);
        root = deleteNode(cloneTree(root), val);
        nodeStates = {};
        log = [...log, `Deleted ${val}`];
        pushHistory();
        await sleep(speed / 2);
        running = false;
        return;
      }
      nodeStates = { ...nodeStates, [node.val]: 'current' };
      await sleep(speed / 2);
      if (val < node.val) {
        log = [...log, `${val} < ${node.val}, go left`];
        node = node.left;
      } else {
        log = [...log, `${val} > ${node.val}, go right`];
        node = node.right;
      }
    }

    nodeStates = {};
    log = [...log, `${val} not found — nothing to delete`];
    pushHistory();
    await sleep(speed);
    running = false;
  }

  function stepBack() {
    if (historyIdx <= 0 || running) return;
    historyIdx--;
    const snap = history[historyIdx];
    root = cloneTree(snap.root);
    nodeStates = { ...snap.nodeStates };
    log = [...snap.log];
  }

  function stepForward() {
    if (historyIdx >= history.length - 1 || running) return;
    historyIdx++;
    const snap = history[historyIdx];
    root = cloneTree(snap.root);
    nodeStates = { ...snap.nodeStates };
    log = [...snap.log];
  }

  function nodeColor(val: number): string {
    const state = nodeStates[val];
    if (state === 'comparing') return '#facc15';
    if (state === 'current') return '#3b82f6';
    if (state === 'found') return '#22c55e';
    if (state === 'deleted') return '#ef4444';
    return 'var(--muted)';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3 flex-wrap">
    <input
      type="number"
      bind:value={inputVal}
      placeholder="Value"
      disabled={running}
      class="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm"
    />
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={animateInsert}
      disabled={running}
    >
      Insert
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={animateSearch}
      disabled={running}
    >
      Search
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={animateDelete}
      disabled={running}
    >
      Delete
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={stepBack}
      disabled={running || historyIdx <= 0}
      title="Step back"
    >
      ◀
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={stepForward}
      disabled={running || historyIdx >= history.length - 1}
      title="Step forward"
    >
      ▶
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

  <div class="flex items-center gap-3 text-sm">
    <span class="text-muted-foreground">Speed:</span>
    <input
      type="range"
      min="100"
      max="1500"
      step="100"
      bind:value={speed}
      class="w-32 accent-primary"
    />
    <span class="text-muted-foreground tabular-nums">{speed}ms</span>
  </div>

  <svg viewBox="0 0 500 350" class="w-full max-w-lg mx-auto" role="img" aria-label="BST visualization">
    {#each edges as edge}
      {@const fromPos = positions.get(edge.from)}
      {@const toPos = positions.get(edge.to)}
      {#if fromPos && toPos}
        <line
          x1={fromPos.x} y1={fromPos.y}
          x2={toPos.x} y2={toPos.y}
          stroke="var(--border)" stroke-width="1.5"
          class="transition-all duration-300"
        />
      {/if}
    {/each}

    {#each [...positions.entries()] as [val, pos]}
      <circle
        cx={pos.x} cy={pos.y} r="20"
        fill={nodeColor(val)}
        stroke="var(--border)" stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={pos.x} y={pos.y + 5}
        text-anchor="middle" font-size="13" font-weight="600"
        fill="var(--foreground)"
      >
        {val}
      </text>
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background: var(--muted)"></span> Unvisited</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-400"></span> Comparing</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Current</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Found</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span> Deleted</span>
  </div>

  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-48 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
