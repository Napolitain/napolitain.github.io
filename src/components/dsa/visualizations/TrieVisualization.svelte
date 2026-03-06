<script lang="ts">
  interface TrieNode {
    children: Record<string, TrieNode>;
    isEnd: boolean;
    id: number;
  }

  let nextId = 0;
  function createNode(): TrieNode {
    return { children: {}, isEnd: false, id: nextId++ };
  }

  let root: TrieNode = $state(createNode());
  let nodeStates: Record<number, string> = $state({});
  let running = $state(false);
  let statusText = $state('');
  let speed = $state(500);
  let inputWord = $state('');

  const preloadWords = ['cat', 'car', 'card', 'care', 'dog', 'do'];

  interface LayoutNode {
    id: number;
    label: string;
    isEnd: boolean;
    x: number;
    y: number;
    parentX: number | null;
    parentY: number | null;
  }

  function computeLayout(node: TrieNode, label: string, depth: number, left: number, right: number, parentX: number | null, parentY: number | null): LayoutNode[] {
    const x = (left + right) / 2;
    const y = 40 + depth * 60;
    const result: LayoutNode[] = [{ id: node.id, label, isEnd: node.isEnd, x, y, parentX, parentY }];

    const keys = Object.keys(node.children).sort();
    if (keys.length === 0) return result;

    const sliceWidth = (right - left) / keys.length;
    keys.forEach((key, i) => {
      const childLeft = left + i * sliceWidth;
      const childRight = childLeft + sliceWidth;
      result.push(...computeLayout(node.children[key], key, depth + 1, childLeft, childRight, x, y));
    });

    return result;
  }

  let layout: LayoutNode[] = $state([]);

  function updateLayout() {
    layout = computeLayout(root, '∅', 0, 20, 580, null, null);
  }

  $effect(() => {
    // Re-derive layout whenever root changes (tracked via nodeStates version)
    void nodeStates;
    void root;
    updateLayout();
  });

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function resetTrie() {
    nextId = 0;
    root = createNode();
    nodeStates = {};
    running = false;
    statusText = '';
    inputWord = '';
    updateLayout();
  }

  async function insertWord(word: string) {
    if (!word || running) return;
    running = true;
    statusText = `Inserting "${word}"...`;

    let node = root;
    nodeStates[node.id] = 'active';
    nodeStates = { ...nodeStates };
    await sleep(speed);

    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = createNode();
        root = root; // trigger reactivity
        updateLayout();
      }
      const child = node.children[char];
      nodeStates[node.id] = 'visited';
      nodeStates[child.id] = 'active';
      nodeStates = { ...nodeStates };
      await sleep(speed);
      node = child;
    }

    node.isEnd = true;
    nodeStates[node.id] = 'found';
    nodeStates = { ...nodeStates };
    root = root;
    updateLayout();
    statusText = `Inserted "${word}" ✓`;
    await sleep(speed);

    // Clear highlights
    nodeStates = {};
    running = false;
  }

  async function searchWord(word: string) {
    if (!word || running) return;
    running = true;
    statusText = `Searching "${word}"...`;

    let node = root;
    nodeStates[node.id] = 'active';
    nodeStates = { ...nodeStates };
    await sleep(speed);

    for (const char of word) {
      if (!node.children[char]) {
        nodeStates[node.id] = 'not-found';
        nodeStates = { ...nodeStates };
        statusText = `"${word}" not found ✗ — no edge for '${char}'`;
        await sleep(speed * 2);
        nodeStates = {};
        running = false;
        return;
      }
      const child = node.children[char];
      nodeStates[node.id] = 'visited';
      nodeStates[child.id] = 'active';
      nodeStates = { ...nodeStates };
      await sleep(speed);
      node = child;
    }

    if (node.isEnd) {
      nodeStates[node.id] = 'found';
      nodeStates = { ...nodeStates };
      statusText = `"${word}" found ✓`;
    } else {
      nodeStates[node.id] = 'not-found';
      nodeStates = { ...nodeStates };
      statusText = `"${word}" is a prefix but not a complete word ✗`;
    }

    await sleep(speed * 2);
    nodeStates = {};
    running = false;
  }

  async function preload() {
    if (running) return;
    resetTrie();
    for (const word of preloadWords) {
      await insertWord(word);
    }
    statusText = `Loaded: ${preloadWords.join(', ')}`;
  }

  function handleInsert() {
    const w = inputWord.trim().toLowerCase();
    if (w) insertWord(w);
  }

  function handleSearch() {
    const w = inputWord.trim().toLowerCase();
    if (w) searchWord(w);
  }

  function getNodeColor(id: number): string {
    const st = nodeStates[id];
    if (st === 'active') return '#3b82f6';
    if (st === 'found') return '#22c55e';
    if (st === 'not-found') return '#ef4444';
    if (st === 'visited') return '#facc15';
    return 'var(--muted)';
  }

  function getEdgeColor(childId: number): string {
    const st = nodeStates[childId];
    if (st === 'active' || st === 'found' || st === 'visited') return '#3b82f6';
    return 'var(--border)';
  }

  // Initialize layout
  $effect(() => {
    updateLayout();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3 flex-wrap">
    <input
      type="text"
      bind:value={inputWord}
      placeholder="Type a word..."
      class="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground w-32"
      disabled={running}
    />
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={handleInsert}
      disabled={running || !inputWord.trim()}
    >
      Insert
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={handleSearch}
      disabled={running || !inputWord.trim()}
    >
      Search
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={preload}
      disabled={running}
    >
      Load Sample Words
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={resetTrie}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <div class="flex items-center gap-3 text-sm">
    <label for="trie-speed" class="text-muted-foreground">Speed:</label>
    <input
      id="trie-speed"
      type="range"
      min="100"
      max="1000"
      step="100"
      bind:value={speed}
      class="w-32"
      disabled={running}
    />
    <span class="text-muted-foreground">{speed}ms</span>
  </div>

  <svg viewBox="0 0 600 400" class="w-full max-w-xl mx-auto" role="img" aria-label="Trie visualization">
    <!-- Edges -->
    {#each layout as node}
      {#if node.parentX !== null && node.parentY !== null}
        <line
          x1={node.parentX}
          y1={node.parentY}
          x2={node.x}
          y2={node.y}
          stroke={getEdgeColor(node.id)}
          stroke-width={nodeStates[node.id] ? 2.5 : 1.5}
          class="transition-all duration-300"
        />
      {/if}
    {/each}

    <!-- Nodes -->
    {#each layout as node}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.isEnd ? 20 : 18}
        fill={getNodeColor(node.id)}
        stroke={node.isEnd ? 'var(--foreground)' : 'var(--border)'}
        stroke-width={node.isEnd ? 2.5 : 1.5}
        class="transition-all duration-300"
      />
      <text
        x={node.x}
        y={node.y + 5}
        text-anchor="middle"
        font-size="14"
        font-weight="600"
        fill="var(--foreground)"
      >
        {node.label}
      </text>
      <!-- End-of-word indicator: small dot -->
      {#if node.isEnd}
        <circle
          cx={node.x + 14}
          cy={node.y - 14}
          r="4"
          fill="#22c55e"
          stroke="var(--foreground)"
          stroke-width="1"
        />
      {/if}
    {/each}
  </svg>

  <!-- Legend -->
  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[var(--muted)] border border-border"></span> Idle</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Active</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-400"></span> Traversed</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Found / End of word</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span> Not found</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full border-2 border-foreground bg-[var(--muted)]"></span> End-of-word node (thick border)</span>
  </div>

  <!-- Status -->
  {#if statusText}
    <div class="text-sm font-mono">
      <p class="text-muted-foreground">{statusText}</p>
    </div>
  {/if}
</div>
