<script lang="ts">
  import { onMount } from 'svelte';

  // Weighted graph: adjacency list with weights
  let graph: Record<string, [string, number][]> = {
    A: [['B', 4], ['C', 2]],
    B: [['A', 4], ['D', 3], ['E', 1]],
    C: [['A', 2], ['D', 5], ['F', 6]],
    D: [['B', 3], ['C', 5], ['E', 2]],
    E: [['B', 1], ['D', 2], ['F', 4]],
    F: [['C', 6], ['E', 4]],
  };

  const positions: Record<string, { x: number; y: number }> = {
    A: { x: 200, y: 40 },
    B: { x: 70, y: 150 },
    C: { x: 330, y: 150 },
    D: { x: 120, y: 280 },
    E: { x: 200, y: 200 },
    F: { x: 320, y: 300 },
  };

  // Deduplicated edges with weights
  let edges: [string, string, number][] = [
    ['A', 'B', 4], ['A', 'C', 2], ['B', 'D', 3], ['B', 'E', 1],
    ['C', 'D', 5], ['C', 'F', 6], ['D', 'E', 2], ['E', 'F', 4],
  ];

  type NodeState = 'unvisited' | 'in-pq' | 'visiting' | 'finalized';

  let nodeStates: Record<string, NodeState> = {};
  let dist: Record<string, number> = {};
  let visitOrder: string[] = [];
  let running = false;
  let currentEdge: [string, string] | null = null;
  let speed = 600;

  function reset() {
    nodeStates = Object.fromEntries(Object.keys(graph).map(n => [n, 'unvisited' as NodeState]));
    dist = Object.fromEntries(Object.keys(graph).map(n => [n, Infinity]));
    visitOrder = [];
    currentEdge = null;
    running = false;
  }

  onMount(reset);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runDijkstra() {
    reset();
    running = true;
    const start = 'A';

    dist[start] = 0;
    dist = { ...dist };
    nodeStates[start] = 'in-pq';
    nodeStates = { ...nodeStates };

    // Simple priority queue as sorted array
    let pq: [number, string][] = [[0, start]];
    const visited = new Set<string>();

    await sleep(speed);

    while (pq.length > 0 && running) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, node] = pq.shift()!;

      if (visited.has(node)) continue;
      visited.add(node);

      nodeStates[node] = 'visiting';
      nodeStates = { ...nodeStates };
      await sleep(speed);

      for (const [neighbor, weight] of graph[node]) {
        if (visited.has(neighbor)) continue;
        const newDist = d + weight;
        currentEdge = [node, neighbor];

        if (newDist < dist[neighbor]) {
          dist[neighbor] = newDist;
          dist = { ...dist };
          nodeStates[neighbor] = 'in-pq';
          nodeStates = { ...nodeStates };
          pq.push([newDist, neighbor]);
        }
        await sleep(speed);
        currentEdge = null;
      }

      nodeStates[node] = 'finalized';
      nodeStates = { ...nodeStates };
      visitOrder = [...visitOrder, node];
      await sleep(speed);
    }

    running = false;
  }

  function randomizeWeights() {
    reset();
    const nodes = Object.keys(positions);
    edges = edges.map(([a, b]) => [a, b, 1 + Math.floor(Math.random() * 10)] as [string, string, number]);
    const newGraph: Record<string, [string, number][]> = {};
    for (const n of nodes) newGraph[n] = [];
    for (const [a, b, w] of edges) {
      newGraph[a].push([b, w]);
      newGraph[b].push([a, w]);
    }
    graph = newGraph;
  }

  const stateColors: Record<NodeState, string> = {
    unvisited: 'var(--muted)',
    'in-pq': '#facc15',
    visiting: '#3b82f6',
    finalized: '#22c55e',
  };

  function edgeHighlighted(e: [string, string, number]): boolean {
    if (!currentEdge) return false;
    return (e[0] === currentEdge[0] && e[1] === currentEdge[1]) ||
           (e[0] === currentEdge[1] && e[1] === currentEdge[0]);
  }

  function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function distLabel(node: string): string {
    const d = dist[node];
    if (d === undefined || d === Infinity) return '∞';
    return String(d);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      on:click={runDijkstra}
      disabled={running}
    >
      {running ? 'Running...' : 'Run Dijkstra'}
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
      on:click={randomizeWeights}
      disabled={running}
    >
      Randomize
    </button>
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      Speed: {speed}ms
      <input type="range" min="100" max="1500" step="100" bind:value={speed} disabled={running} class="w-24" />
    </label>
  </div>

  <svg viewBox="0 0 400 350" class="w-full max-w-md mx-auto" role="img" aria-label="Dijkstra visualization">
    {#each edges as edge}
      {@const p1 = positions[edge[0]]}
      {@const p2 = positions[edge[1]]}
      {@const mid = midpoint(p1, p2)}
      <line
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={edgeHighlighted(edge) ? '#3b82f6' : 'var(--border)'}
        stroke-width={edgeHighlighted(edge) ? 3 : 1.5}
        class="transition-all duration-300"
      />
      <text
        x={mid.x} y={mid.y - 6}
        text-anchor="middle" font-size="11" font-weight="500"
        fill="var(--muted-foreground)"
      >
        {edge[2]}
      </text>
    {/each}

    {#each Object.entries(positions) as [node, pos]}
      <circle
        cx={pos.x} cy={pos.y} r="24"
        fill={stateColors[nodeStates[node] || 'unvisited']}
        stroke="var(--border)" stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={pos.x} y={pos.y + 1}
        text-anchor="middle" font-size="13" font-weight="600"
        fill="var(--foreground)"
      >
        {node}
      </text>
      <text
        x={pos.x} y={pos.y + 14}
        text-anchor="middle" font-size="9" font-weight="500"
        fill="var(--foreground)" opacity="0.7"
      >
        {distLabel(node)}
      </text>
    {/each}
  </svg>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Unvisited</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-400"></span> In PQ</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Visiting</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Finalized</span>
  </div>

  {#if visitOrder.length > 0}
    <div class="text-sm space-y-1 font-mono">
      <p><span class="text-muted-foreground">Finalized:</span> {visitOrder.join(' → ')}</p>
      <p><span class="text-muted-foreground">Distances:</span> {visitOrder.map(n => `${n}=${dist[n]}`).join(', ')}</p>
    </div>
  {/if}
</div>
