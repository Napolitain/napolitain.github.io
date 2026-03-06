<script lang="ts">
  type Edge = { u: string; v: string; w: number };
  type EdgeState = 'unprocessed' | 'considering' | 'accepted' | 'rejected';
  type NodeState = 'isolated' | 'in-mst';

  interface Step {
    sortedIdx: number;
    edgeStates: Record<string, EdgeState>;
    nodeStates: Record<string, NodeState>;
    mstWeight: number;
  }

  const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const pos: Record<string, { x: number; y: number }> = {
    A: { x: 250, y: 45 },
    B: { x: 420, y: 115 },
    C: { x: 390, y: 310 },
    D: { x: 250, y: 375 },
    E: { x: 110, y: 310 },
    F: { x: 80, y: 115 },
    G: { x: 250, y: 200 },
  };

  const endpts: [string, string][] = [
    ['A', 'B'], ['A', 'F'], ['A', 'G'], ['B', 'C'], ['B', 'G'],
    ['C', 'D'], ['C', 'G'], ['D', 'E'], ['E', 'G'], ['F', 'G'],
  ];
  const defaultW = [7, 2, 5, 4, 10, 9, 3, 6, 8, 1];

  function ek(u: string, v: string): string {
    return u < v ? `${u}-${v}` : `${v}-${u}`;
  }

  let edges = $state<Edge[]>(endpts.map(([u, v], i) => ({ u, v, w: defaultW[i] })));
  let sorted = $state<Edge[]>([]);
  let esMap = $state<Record<string, EdgeState>>({});
  let nsMap = $state<Record<string, NodeState>>(
    Object.fromEntries(nodes.map(n => [n, 'isolated' as NodeState]))
  );
  let mstWeight = $state(0);
  let running = $state(false);
  let speedVal = $state(5);
  let steps = $state<Step[]>([]);
  let stepIdx = $state(-1);
  let runId = $state(0);

  let currentSortedIdx = $derived(
    stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx].sortedIdx : -1
  );

  $effect(() => {
    return () => { runId++; };
  });

  function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  function reset() {
    runId++;
    sorted = [];
    esMap = {};
    nsMap = Object.fromEntries(nodes.map(n => [n, 'isolated' as NodeState]));
    mstWeight = 0;
    running = false;
    steps = [];
    stepIdx = -1;
  }

  function computeSteps() {
    sorted = [...edges].sort((a, b) => a.w - b.w);

    const parent = nodes.map((_, i) => i);
    const rank = nodes.map(() => 0);
    const ni = (name: string) => nodes.indexOf(name);

    function find(x: number): number {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    }
    function union(x: number, y: number): boolean {
      const rx = find(x), ry = find(y);
      if (rx === ry) return false;
      if (rank[rx] < rank[ry]) parent[rx] = ry;
      else if (rank[rx] > rank[ry]) parent[ry] = rx;
      else { parent[ry] = rx; rank[rx]++; }
      return true;
    }

    const es: Record<string, EdgeState> = {};
    for (const e of edges) es[ek(e.u, e.v)] = 'unprocessed';
    const ns: Record<string, NodeState> = Object.fromEntries(
      nodes.map(n => [n, 'isolated' as NodeState])
    );
    let w = 0;
    const all: Step[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const { u, v, w: ew } = sorted[i];
      const key = ek(u, v);

      es[key] = 'considering';
      all.push({ sortedIdx: i, edgeStates: { ...es }, nodeStates: { ...ns }, mstWeight: w });

      if (union(ni(u), ni(v))) {
        es[key] = 'accepted';
        ns[u] = 'in-mst';
        ns[v] = 'in-mst';
        w += ew;
      } else {
        es[key] = 'rejected';
      }
      all.push({ sortedIdx: i, edgeStates: { ...es }, nodeStates: { ...ns }, mstWeight: w });
    }

    steps = all;
    esMap = Object.fromEntries(edges.map(e => [ek(e.u, e.v), 'unprocessed' as EdgeState]));
    nsMap = Object.fromEntries(nodes.map(n => [n, 'isolated' as NodeState]));
    mstWeight = 0;
    stepIdx = -1;
  }

  function applyStep(idx: number) {
    if (idx < 0 || idx >= steps.length) return;
    const s = steps[idx];
    esMap = { ...s.edgeStates };
    nsMap = { ...s.nodeStates };
    mstWeight = s.mstWeight;
    stepIdx = idx;
  }

  async function runKruskal() {
    reset();
    computeSteps();
    running = true;
    const myId = runId;

    for (let i = 0; i < steps.length; i++) {
      if (runId !== myId) break;
      applyStep(i);
      await sleep((11 - speedVal) * 100);
    }
    if (runId === myId) running = false;
  }

  function stepForward() {
    if (steps.length === 0) computeSteps();
    if (stepIdx < steps.length - 1) applyStep(stepIdx + 1);
  }

  function stepBack() {
    if (stepIdx > 0) {
      applyStep(stepIdx - 1);
    } else if (stepIdx === 0) {
      esMap = Object.fromEntries(edges.map(e => [ek(e.u, e.v), 'unprocessed' as EdgeState]));
      nsMap = Object.fromEntries(nodes.map(n => [n, 'isolated' as NodeState]));
      mstWeight = 0;
      stepIdx = -1;
    }
  }

  function randomize() {
    reset();
    edges = endpts.map(([u, v]) => ({ u, v, w: Math.floor(Math.random() * 12) + 1 }));
  }

  function mid(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function getES(u: string, v: string): EdgeState {
    return esMap[ek(u, v)] ?? 'unprocessed';
  }

  function edgeColor(s: EdgeState): string {
    if (s === 'considering') return '#facc15';
    if (s === 'accepted') return '#22c55e';
    if (s === 'rejected') return '#ef4444';
    return 'var(--muted)';
  }

  function edgeWidth(s: EdgeState): number {
    if (s === 'accepted') return 3.5;
    if (s === 'considering') return 3;
    return 1.5;
  }

  function nodeColor(n: string): string {
    return nsMap[n] === 'in-mst' ? '#22c55e' : 'var(--muted)';
  }

  function edgePillClass(s: EdgeState, active: boolean): string {
    let c = 'px-2 py-1 rounded border transition-all duration-200';
    if (s === 'considering') c += ' border-yellow-400 bg-yellow-400/20';
    else if (s === 'accepted') c += ' border-green-500 bg-green-500/20';
    else if (s === 'rejected') c += ' border-red-500 bg-red-500/20';
    else c += ' border-border';
    if (active) c += ' font-bold';
    return c;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center gap-3">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={runKruskal}
      disabled={running}
    >
      {running ? 'Running…' : 'Run Kruskal'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={reset}
    >
      Reset
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={randomize}
      disabled={running}
    >
      Randomize Weights
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepBack}
      disabled={running || stepIdx < 0}
    >
      ◀
    </button>
    <button
      class="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
      onclick={stepForward}
      disabled={running || (steps.length > 0 && stepIdx === steps.length - 1)}
    >
      ▶
    </button>
    <label class="flex items-center gap-2 text-sm text-muted-foreground">
      Speed
      <input type="range" min={1} max={10} bind:value={speedVal} class="w-20 accent-primary" />
    </label>
  </div>

  <svg viewBox="0 0 500 400" class="w-full max-w-lg mx-auto" role="img" aria-label="MST visualization">
    {#each edges as edge}
      {@const p1 = pos[edge.u]}
      {@const p2 = pos[edge.v]}
      {@const m = mid(p1, p2)}
      {@const s = getES(edge.u, edge.v)}
      <line
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={edgeColor(s)}
        stroke-width={edgeWidth(s)}
        class="transition-all duration-300"
      />
      <text
        x={m.x} y={m.y - 8}
        text-anchor="middle" font-size="12" font-weight="600"
        fill="var(--foreground)"
        stroke="var(--background)" stroke-width="3" paint-order="stroke"
      >
        {edge.w}
      </text>
    {/each}

    {#each nodes as node}
      {@const p = pos[node]}
      <circle
        cx={p.x} cy={p.y} r="22"
        fill={nodeColor(node)}
        stroke="var(--border)" stroke-width="2"
        class="transition-all duration-300"
      />
      <text
        x={p.x} y={p.y + 5}
        text-anchor="middle" font-size="14" font-weight="600"
        fill="var(--foreground)"
      >
        {node}
      </text>
    {/each}
  </svg>

  <div class="space-y-3">
    <p class="text-sm font-mono">
      <span class="text-muted-foreground">MST weight:</span>
      <span class="font-bold">{mstWeight}</span>
    </p>

    {#if sorted.length > 0}
      <div class="flex flex-wrap gap-2 text-xs font-mono">
        {#each sorted as edge, i}
          {@const key = ek(edge.u, edge.v)}
          {@const s = esMap[key] ?? 'unprocessed'}
          <span
            class={edgePillClass(s, i === currentSortedIdx)}
          >
            {edge.u}‑{edge.v}: {edge.w}
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Unprocessed
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-yellow-400"></span> Considering
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-green-500"></span> Accepted / In MST
    </span>
    <span class="flex items-center gap-1.5">
      <span class="w-3 h-3 rounded-full bg-red-500"></span> Rejected
    </span>
  </div>
</div>
