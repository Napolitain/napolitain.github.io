<script lang="ts">
  type Node = {
    key: number;
    priority: number;
    x: number;
    y: number;
  };

  const states = [
    {
      title: 'BST by key',
      note: 'Keys preserve inorder traversal: left keys smaller, right keys larger.',
      highlight: [40],
    },
    {
      title: 'Heap by priority',
      note: 'Higher heap priority rises upward, so rotations restore the heap rule after insertion.',
      highlight: [20, 30],
    },
  ];

  const nodes: Node[] = [
    { key: 40, priority: 70, x: 50, y: 12 },
    { key: 20, priority: 85, x: 28, y: 34 },
    { key: 60, priority: 60, x: 72, y: 34 },
    { key: 10, priority: 40, x: 18, y: 58 },
    { key: 30, priority: 65, x: 38, y: 58 },
    { key: 50, priority: 50, x: 62, y: 58 },
    { key: 80, priority: 35, x: 82, y: 58 },
  ];

  const edges = [
    [20, 10],
    [20, 40],
    [40, 30],
    [40, 60],
    [60, 50],
    [60, 80],
  ];

  let stateIndex = 0;
  $: state = states[stateIndex];

  function toggle() {
    stateIndex = (stateIndex + 1) % states.length;
  }

  function findNode(key: number) {
    return nodes.find(node => node.key === key)!;
  }
</script>

<div class="space-y-6">
  <button class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer" on:click={toggle}>
    Toggle viewpoint
  </button>

  <div class="rounded-2xl border border-border bg-card p-5 space-y-5">
    <svg viewBox="0 0 100 72" class="w-full h-auto rounded-xl border border-border bg-secondary/20 p-4">
      {#each edges as [from, to]}
        {@const parent = findNode(from)}
        {@const child = findNode(to)}
        <line x1={parent.x} y1={parent.y} x2={child.x} y2={child.y} stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" />
      {/each}

      {#each nodes as node}
        <g>
          <circle
            cx={node.x}
            cy={node.y}
            r="6.5"
            class={state.highlight.includes(node.key) ? 'fill-primary/80 stroke-primary' : 'fill-secondary stroke-border'}
            stroke-width="1.5"
          />
          <text x={node.x} y={node.y - 0.8} text-anchor="middle" font-size="3.2" fill="currentColor">{node.key}</text>
          <text x={node.x} y={node.y + 10} text-anchor="middle" font-size="2.6" fill="currentColor" opacity="0.7">p={node.priority}</text>
        </g>
      {/each}
    </svg>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each nodes as node}
        <div class={`rounded-xl border p-3 ${state.highlight.includes(node.key) ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
          <p class="font-semibold">key {node.key}</p>
          <p class="text-sm text-muted-foreground">priority {node.priority}</p>
        </div>
      {/each}
    </div>
  </div>

  <div class="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2">
    <h3 class="text-base font-semibold">{state.title}</h3>
    <p class="text-sm text-muted-foreground leading-relaxed">{state.note}</p>
  </div>
</div>
