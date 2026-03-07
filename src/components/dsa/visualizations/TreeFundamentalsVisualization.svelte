<script lang="ts">
  import { onMount } from 'svelte';

  type Mode = 'idle' | 'levels' | 'bfs' | 'dfs';
  type NodeId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

  const positions: Record<NodeId, { x: number; y: number }> = {
    A: { x: 200, y: 45 },
    B: { x: 105, y: 135 },
    C: { x: 295, y: 135 },
    D: { x: 55, y: 255 },
    E: { x: 155, y: 255 },
    F: { x: 255, y: 255 },
    G: { x: 345, y: 255 },
  };

  const levels: Record<NodeId, number> = {
    A: 0,
    B: 1,
    C: 1,
    D: 2,
    E: 2,
    F: 2,
    G: 2,
  };

  const edges: [NodeId, NodeId][] = [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['B', 'E'],
    ['C', 'F'],
    ['C', 'G'],
  ];

  const bfsOrder: NodeId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const dfsOrder: NodeId[] = ['A', 'B', 'D', 'E', 'C', 'F', 'G'];

  let mode: Mode = 'idle';
  let running = false;
  let activeNode: NodeId | null = null;
  let visitOrder: NodeId[] = [];
  let log: string[] = [];

  function reset() {
    mode = 'idle';
    running = false;
    activeNode = null;
    visitOrder = [];
    log = [];
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runTraversal(kind: 'bfs' | 'dfs') {
    reset();
    mode = kind;
    running = true;
    log = [
      kind === 'bfs'
        ? 'BFS visits the tree level by level.'
        : 'DFS dives down one branch before backtracking.',
    ];

    const order = kind === 'bfs' ? bfsOrder : dfsOrder;

    for (const node of order) {
      activeNode = node;
      visitOrder = [...visitOrder, node];
      log = [...log, `${kind.toUpperCase()}: visit ${node}`];
      await sleep(550);
    }

    activeNode = null;
    running = false;
  }

  function showLevels() {
    reset();
    mode = 'levels';
    log = ['Nodes with the same depth form a level. Trees make this hierarchy explicit.'];
  }

  function nodeColor(node: NodeId): string {
    if (mode === 'levels') {
      if (levels[node] === 0) {
        return '#3b82f6';
      }
      if (levels[node] === 1) {
        return '#22c55e';
      }
      return '#f59e0b';
    }

    if (activeNode === node) {
      return '#3b82f6';
    }

    if (visitOrder.includes(node)) {
      return '#22c55e';
    }

    return 'var(--muted)';
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer"
      on:click={showLevels}
      disabled={running}
    >
      Show levels
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer"
      on:click={() => runTraversal('bfs')}
      disabled={running}
    >
      Run BFS
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer"
      on:click={() => runTraversal('dfs')}
      disabled={running}
    >
      Run DFS
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 300" class="w-full max-w-md mx-auto" role="img" aria-label="Tree fundamentals visualization">
    {#each edges as [from, to]}
      <line
        x1={positions[from].x}
        y1={positions[from].y}
        x2={positions[to].x}
        y2={positions[to].y}
        stroke="var(--border)"
        stroke-width="1.5"
      />
    {/each}

    {#each Object.entries(positions) as [node, position]}
      <circle
        cx={position.x}
        cy={position.y}
        r="22"
        fill={nodeColor(node as NodeId)}
        stroke="var(--border)"
        stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={position.x}
        y={position.y + 5}
        text-anchor="middle"
        font-size="13"
        font-weight="600"
        fill="var(--foreground)"
      >
        {node}
      </text>
    {/each}
  </svg>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">
      {mode === 'levels' ? 'Depth gives trees their shape' : mode === 'dfs' ? 'DFS follows one branch at a time' : mode === 'bfs' ? 'BFS works level by level' : 'Trees expose hierarchy directly'}
    </h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {mode === 'levels'
        ? 'Because a tree is connected and acyclic, every node has a unique depth from the root.'
        : mode === 'dfs'
          ? 'Recursive tree problems are usually DFS under the hood: solve subtrees, then combine their answers.'
          : mode === 'bfs'
            ? 'Level-order traversal is just BFS on a rooted tree, and it never needs a visited set.'
            : 'Every node except the root has exactly one parent, which makes subtree reasoning much cleaner than on a general graph.'}
    </p>
  </div>

  <div class="flex flex-wrap gap-4 text-sm">
    {#if mode === 'levels'}
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Root</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Level 1</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Level 2+</span>
    {:else}
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Unvisited</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Active</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Visited</span>
    {/if}
  </div>

  {#if visitOrder.length > 0 || log.length > 0}
    <div class="space-y-2">
      {#if visitOrder.length > 0}
        <p class="text-sm font-mono">
          <span class="text-muted-foreground">Visit order:</span>
          {' '}
          {visitOrder.join(' → ')}
        </p>
      {/if}

      <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
        {#each log as entry}
          <p class="text-muted-foreground">{entry}</p>
        {/each}
      </div>
    </div>
  {/if}
</div>
