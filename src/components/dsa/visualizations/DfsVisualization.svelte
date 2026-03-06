<script lang="ts">
  import { onMount } from 'svelte';

  let graph: Record<string, string[]> = {
    A: ['B', 'C'],
    B: ['A', 'D', 'E'],
    C: ['A', 'F'],
    D: ['B'],
    E: ['B', 'F'],
    F: ['C', 'E'],
  };

  const positions: Record<string, { x: number; y: number }> = {
    A: { x: 200, y: 50 },
    B: { x: 80, y: 160 },
    C: { x: 320, y: 160 },
    D: { x: 30, y: 290 },
    E: { x: 170, y: 290 },
    F: { x: 320, y: 290 },
  };

  let edges: [string, string][] = [
    ['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['E', 'F'],
  ];

  type NodeState = 'unvisited' | 'stacked' | 'visiting' | 'visited';

  let nodeStates: Record<string, NodeState> = {};
  let stack: string[] = [];
  let visitOrder: string[] = [];
  let running = false;
  let currentEdge: [string, string] | null = null;
  let speed = 600;

  function reset() {
    nodeStates = Object.fromEntries(Object.keys(graph).map(n => [n, 'unvisited' as NodeState]));
    stack = [];
    visitOrder = [];
    currentEdge = null;
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runDfs() {
    reset();
    running = true;
    const start = 'A';

    stack = [start];
    nodeStates[start] = 'stacked';
    nodeStates = nodeStates;

    await sleep(speed);

    while (stack.length > 0 && running) {
      const node = stack.pop()!;
      stack = [...stack];

      if (nodeStates[node] === 'visited') continue;

      nodeStates[node] = 'visiting';
      nodeStates = nodeStates;
      await sleep(speed);

      // Push neighbors in reverse so leftmost is visited first
      const neighbors = [...graph[node]].reverse();
      for (const neighbor of neighbors) {
        if (nodeStates[neighbor] === 'unvisited') {
          currentEdge = [node, neighbor];
          nodeStates[neighbor] = 'stacked';
          nodeStates = nodeStates;
          stack = [...stack, neighbor];
          await sleep(speed);
          currentEdge = null;
        }
      }

      nodeStates[node] = 'visited';
      nodeStates = nodeStates;
      visitOrder = [...visitOrder, node];
      await sleep(speed);
    }

    running = false;
  }

  function randomizeGraph() {
    reset();
    const nodes = Object.keys(positions);
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    const newEdges: [string, string][] = [];
    for (let i = 1; i < shuffled.length; i++) {
      newEdges.push([shuffled[i - 1], shuffled[i]]);
    }
    const extraCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < extraCount; i++) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a !== b && !newEdges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) {
        newEdges.push([a, b]);
      }
    }
    const newGraph: Record<string, string[]> = {};
    for (const n of nodes) newGraph[n] = [];
    for (const [a, b] of newEdges) {
      newGraph[a].push(b);
      newGraph[b].push(a);
    }
    graph = newGraph;
    edges = newEdges;
  }

  const stateColors: Record<NodeState, string> = {
    unvisited: 'var(--muted)',
    stacked: '#a855f7',
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
      on:click={runDfs}
      disabled={running}
    >
      {running ? 'Running...' : 'Run DFS'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={randomizeGraph}
      disabled={running}
    >
      Randomize
    </button>
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      Speed: {speed}ms
      <input type="range" min="100" max="1500" step="100" bind:value={speed} disabled={running} class="w-24" />
    </label>
  </div>

  <svg viewBox="0 0 400 350" class="w-full max-w-md mx-auto" role="img" aria-label="DFS graph visualization">
    {#each edges as edge}
      <line
        x1={positions[edge[0]].x}
        y1={positions[edge[0]].y}
        x2={positions[edge[1]].x}
        y2={positions[edge[1]].y}
        stroke={edgeHighlighted(edge) ? '#a855f7' : 'var(--border)'}
        stroke-width={edgeHighlighted(edge) ? 3 : 1.5}
        class="transition-all duration-300"
      />
    {/each}

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

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Unvisited</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-purple-500"></span> On Stack</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Visiting</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Visited</span>
  </div>

  {#if stack.length > 0 || visitOrder.length > 0}
    <div class="text-sm space-y-1 font-mono">
      {#if stack.length > 0}
        <p><span class="text-muted-foreground">Stack:</span> [{stack.join(', ')}]  ← top</p>
      {/if}
      {#if visitOrder.length > 0}
        <p><span class="text-muted-foreground">Visit order:</span> {visitOrder.join(' → ')}</p>
      {/if}
    </div>
  {/if}
</div>
