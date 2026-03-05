<script lang="ts">
  import { onMount } from 'svelte';

  // DAG: directed edges only
  const graph: Record<string, string[]> = {
    A: ['C', 'D'],
    B: ['D', 'E'],
    C: ['F'],
    D: ['F'],
    E: [],
    F: [],
  };

  const positions: Record<string, { x: number; y: number }> = {
    A: { x: 80, y: 50 },
    B: { x: 280, y: 50 },
    C: { x: 50, y: 170 },
    D: { x: 200, y: 170 },
    E: { x: 330, y: 170 },
    F: { x: 140, y: 300 },
  };

  // Directed edges
  const edges: [string, string][] = [
    ['A', 'C'], ['A', 'D'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['D', 'F'],
  ];

  type NodeState = 'unvisited' | 'exploring' | 'finished';

  let nodeStates: Record<string, NodeState> = {};
  let result: string[] = [];
  let running = false;
  let currentEdge: [string, string] | null = null;

  function reset() {
    nodeStates = Object.fromEntries(Object.keys(graph).map(n => [n, 'unvisited' as NodeState]));
    result = [];
    currentEdge = null;
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function dfs(node: string) {
    if (!running) return;
    nodeStates[node] = 'exploring';
    nodeStates = { ...nodeStates };
    await sleep(500);

    for (const neighbor of graph[node]) {
      if (nodeStates[neighbor] === 'unvisited') {
        currentEdge = [node, neighbor];
        await sleep(300);
        await dfs(neighbor);
        currentEdge = null;
      }
    }

    nodeStates[node] = 'finished';
    nodeStates = { ...nodeStates };
    result = [node, ...result];
    await sleep(400);
  }

  async function runTopoSort() {
    reset();
    running = true;

    // Process all nodes (graph may not be connected)
    const nodes = Object.keys(graph);
    for (const node of nodes) {
      if (nodeStates[node] === 'unvisited' && running) {
        await dfs(node);
      }
    }

    running = false;
  }

  const stateColors: Record<NodeState, string> = {
    unvisited: 'var(--muted)',
    exploring: '#3b82f6',
    finished: '#22c55e',
  };

  function edgeMatch(e: [string, string]): boolean {
    if (!currentEdge) return false;
    return e[0] === currentEdge[0] && e[1] === currentEdge[1];
  }

  // Arrowhead helper
  function arrowPoints(x1: number, y1: number, x2: number, y2: number): string {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    // Pull back to circle edge (r=24)
    const tipX = x2 - ux * 26;
    const tipY = y2 - uy * 26;
    const size = 8;
    const px = -uy * size;
    const py = ux * size;
    return `${tipX},${tipY} ${tipX - ux * size + px},${tipY - uy * size + py} ${tipX - ux * size - px},${tipY - uy * size - py}`;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runTopoSort}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Topological Sort'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      on:click={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <svg viewBox="0 0 400 350" class="w-full max-w-md mx-auto" role="img" aria-label="Topological sort visualization">
    {#each edges as edge}
      {@const p1 = positions[edge[0]]}
      {@const p2 = positions[edge[1]]}
      <line
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={edgeMatch(edge) ? '#3b82f6' : 'var(--border)'}
        stroke-width={edgeMatch(edge) ? 3 : 1.5}
        class="transition-all duration-300"
      />
      <polygon
        points={arrowPoints(p1.x, p1.y, p2.x, p2.y)}
        fill={edgeMatch(edge) ? '#3b82f6' : 'var(--border)'}
        class="transition-all duration-300"
      />
    {/each}

    {#each Object.entries(positions) as [node, pos]}
      <circle
        cx={pos.x} cy={pos.y} r="24"
        fill={stateColors[nodeStates[node] || 'unvisited']}
        stroke="var(--border)" stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={pos.x} y={pos.y + 5}
        text-anchor="middle" font-size="14" font-weight="600"
        fill="var(--foreground)"
      >
        {node}
      </text>
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Unvisited</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Exploring</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Finished</span>
  </div>

  {#if result.length > 0}
    <div class="text-sm font-mono">
      <p><span class="text-muted-foreground">Topological order:</span> {result.join(' → ')}</p>
    </div>
  {/if}
</div>
