<script lang="ts">
  type Mode = 'overview' | 'path' | 'cycle' | 'tree';
  type NodeId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

  const positions: Record<NodeId, { x: number; y: number }> = {
    A: { x: 200, y: 45 },
    B: { x: 85, y: 145 },
    C: { x: 315, y: 145 },
    D: { x: 45, y: 290 },
    E: { x: 205, y: 225 },
    F: { x: 320, y: 290 },
  };

  const edges: [NodeId, NodeId][] = [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['B', 'E'],
    ['C', 'E'],
    ['C', 'F'],
    ['E', 'F'],
  ];

  const pathEdgeKeys = new Set(['A-C', 'C-F']);
  const pathNodes = new Set<NodeId>(['A', 'C', 'F']);
  const cycleEdgeKeys = new Set(['C-E', 'C-F', 'E-F']);
  const cycleNodes = new Set<NodeId>(['C', 'E', 'F']);
  const treeEdgeKeys = new Set(['A-B', 'A-C', 'B-D', 'B-E', 'C-F']);

  const modeTitles: Record<Mode, string> = {
    overview: 'A graph is the general container',
    path: 'Paths are just edge sequences',
    cycle: 'Cycles let you come back to where you started',
    tree: 'A tree is a graph with extra rules',
  };

  const modeDescriptions: Record<Mode, string> = {
    overview: 'Graphs model relationships. Once you can see nodes and edges clearly, traversal and shortest-path algorithms become natural.',
    path: 'A path follows connected edges from one node to another. Many graph problems reduce to finding or comparing paths.',
    cycle: 'Cycles are what separate general graphs from trees. They force you to think about visited sets, parent tracking, or stronger invariants.',
    tree: 'Highlighted edges form a spanning tree: connected, acyclic, and still covering every node. This is why trees are a special case of graphs.',
  };

  let mode: Mode = 'overview';

  function edgeKey(a: NodeId, b: NodeId): string {
    return [a, b].sort().join('-');
  }

  function isEdgeHighlighted([a, b]: [NodeId, NodeId]): boolean {
    const key = edgeKey(a, b);
    if (mode === 'path') {
      return pathEdgeKeys.has(key);
    }
    if (mode === 'cycle') {
      return cycleEdgeKeys.has(key);
    }
    if (mode === 'tree') {
      return treeEdgeKeys.has(key);
    }
    return false;
  }

  function isNodeHighlighted(node: NodeId): boolean {
    if (mode === 'path') {
      return pathNodes.has(node);
    }
    if (mode === 'cycle') {
      return cycleNodes.has(node);
    }
    if (mode === 'tree') {
      return true;
    }
    return false;
  }

  function nodeColor(node: NodeId): string {
    if (!isNodeHighlighted(node)) {
      return 'var(--muted)';
    }

    if (mode === 'tree') {
      return '#22c55e';
    }

    return '#3b82f6';
  }

  function edgeColor(edge: [NodeId, NodeId]): string {
    if (!isEdgeHighlighted(edge)) {
      return 'var(--border)';
    }

    if (mode === 'tree') {
      return '#22c55e';
    }

    return '#3b82f6';
  }

  function edgeWidth(edge: [NodeId, NodeId]): number {
    return isEdgeHighlighted(edge) ? 3 : 1.5;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap gap-3">
    <button
      class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'overview' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
      on:click={() => { mode = 'overview'; }}
    >
      Overview
    </button>
    <button
      class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'path' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
      on:click={() => { mode = 'path'; }}
    >
      Highlight a path
    </button>
    <button
      class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'cycle' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
      on:click={() => { mode = 'cycle'; }}
    >
      Highlight a cycle
    </button>
    <button
      class={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${mode === 'tree' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
      on:click={() => { mode = 'tree'; }}
    >
      Show a tree inside it
    </button>
  </div>

  <svg viewBox="0 0 360 330" class="w-full max-w-md mx-auto" role="img" aria-label="Graph fundamentals visualization">
    {#each edges as edge}
      <line
        x1={positions[edge[0]].x}
        y1={positions[edge[0]].y}
        x2={positions[edge[1]].x}
        y2={positions[edge[1]].y}
        stroke={edgeColor(edge)}
        stroke-width={edgeWidth(edge)}
        class="transition-all duration-300"
      />
    {/each}

    {#each Object.entries(positions) as [node, position]}
      <circle
        cx={position.x}
        cy={position.y}
        r="24"
        fill={nodeColor(node as NodeId)}
        stroke="var(--border)"
        stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={position.x}
        y={position.y + 5}
        text-anchor="middle"
        font-size="14"
        font-weight="600"
        fill="var(--foreground)"
      >
        {node}
      </text>
    {/each}
  </svg>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">{modeTitles[mode]}</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">
      {modeDescriptions[mode]}
    </p>
  </div>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span>
      General graph structure
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-blue-500"></span>
      Active graph feature
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-green-500"></span>
      Tree-only subset
    </span>
  </div>
</div>
