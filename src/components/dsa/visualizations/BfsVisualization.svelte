<script lang="ts">
  import { onMount } from 'svelte';

  // Graph definition: adjacency list
  const graph: Record<string, string[]> = {
    A: ['B', 'C'],
    B: ['A', 'D', 'E'],
    C: ['A', 'F'],
    D: ['B'],
    E: ['B', 'F'],
    F: ['C', 'E'],
  };

  // Node positions for SVG layout
  const positions: Record<string, { x: number; y: number }> = {
    A: { x: 200, y: 50 },
    B: { x: 80, y: 160 },
    C: { x: 320, y: 160 },
    D: { x: 30, y: 290 },
    E: { x: 170, y: 290 },
    F: { x: 320, y: 290 },
  };

  // Edges (deduplicated)
  const edges = [
    ['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['E', 'F'],
  ];

  type NodeState = 'unvisited' | 'queued' | 'visiting' | 'visited';

  let nodeStates: Record<string, NodeState> = {};
  let queue: string[] = [];
  let visitOrder: string[] = [];
  let running = false;
  let step = 0;
  let currentEdge: [string, string] | null = null;

  function reset() {
    nodeStates = Object.fromEntries(Object.keys(graph).map(n => [n, 'unvisited' as NodeState]));
    queue = [];
    visitOrder = [];
    step = 0;
    currentEdge = null;
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runBfs() {
    reset();
    running = true;
    const start = 'A';

    queue = [start];
    nodeStates[start] = 'queued';
    nodeStates = nodeStates;

    await sleep(600);

    while (queue.length > 0 && running) {
      const node = queue.shift()!;
      nodeStates[node] = 'visiting';
      nodeStates = nodeStates;
      queue = queue;
      step++;
      await sleep(600);

      for (const neighbor of graph[node]) {
        if (nodeStates[neighbor] === 'unvisited') {
          currentEdge = [node, neighbor];
          nodeStates[neighbor] = 'queued';
          nodeStates = nodeStates;
          queue = [...queue];
          await sleep(400);
          currentEdge = null;
        }
      }

      nodeStates[node] = 'visited';
      nodeStates = nodeStates;
      visitOrder = [...visitOrder, node];
      await sleep(300);
    }

    running = false;
  }

  const stateColors: Record<NodeState, string> = {
    unvisited: 'var(--muted)',
    queued: '#facc15',
    visiting: '#3b82f6',
    visited: '#22c55e',
  };

  function edgeHighlighted(e: string[]): boolean {
    if (!currentEdge) return false;
    return (e[0] === currentEdge[0] && e[1] === currentEdge[1]) ||
           (e[0] === currentEdge[1] && e[1] === currentEdge[0]);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runBfs}
      disabled={running}
    >
      {running ? 'Running...' : 'Run BFS'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 350" class="w-full max-w-md mx-auto" role="img" aria-label="BFS graph visualization">
    <!-- Edges -->
    {#each edges as edge}
      <line
        x1={positions[edge[0]].x}
        y1={positions[edge[0]].y}
        x2={positions[edge[1]].x}
        y2={positions[edge[1]].y}
        stroke={edgeHighlighted(edge) ? '#3b82f6' : 'var(--border)'}
        stroke-width={edgeHighlighted(edge) ? 3 : 1.5}
        class="transition-all duration-300"
      />
    {/each}

    <!-- Nodes -->
    {#each Object.entries(positions) as [node, pos]}
      <circle
        cx={pos.x}
        cy={pos.y}
        r="24"
        fill={stateColors[nodeStates[node] || 'unvisited']}
        stroke="var(--border)"
        stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={pos.x}
        y={pos.y + 5}
        text-anchor="middle"
        font-size="14"
        font-weight="600"
        fill="var(--foreground)"
      >
        {node}
      </text>
    {/each}
  </svg>

  <!-- Legend + State -->
  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Unvisited</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-400"></span> Queued</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Visiting</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Visited</span>
  </div>

  {#if queue.length > 0 || visitOrder.length > 0}
    <div class="text-sm space-y-1 font-mono">
      {#if queue.length > 0}
        <p><span class="text-muted-foreground">Queue:</span> [{queue.join(', ')}]</p>
      {/if}
      {#if visitOrder.length > 0}
        <p><span class="text-muted-foreground">Visit order:</span> {visitOrder.join(' → ')}</p>
      {/if}
    </div>
  {/if}
</div>
