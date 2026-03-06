<script lang="ts">
  type Operation = 'AND' | 'OR' | 'XOR' | 'NOT' | 'LSH' | 'RSH';

  let numA = $state(42);
  let numB = $state(105);
  let operation: Operation = $state('XOR');
  let speed = $state(200);
  let running = $state(false);

  // Animation state: -1 = not started, 0-7 = processing bit index, 8 = done
  let processingBit = $state(-1);
  let resultBits: (number | null)[] = $state([null, null, null, null, null, null, null, null]);
  let log: string[] = $state([]);

  const operations: { key: Operation; label: string }[] = [
    { key: 'AND', label: 'AND' },
    { key: 'OR', label: 'OR' },
    { key: 'XOR', label: 'XOR' },
    { key: 'NOT', label: 'NOT A' },
    { key: 'LSH', label: 'A << 1' },
    { key: 'RSH', label: 'A >> 1' },
  ];

  function clamp(v: number): number {
    return Math.max(0, Math.min(255, Math.floor(v) || 0));
  }

  function toBinary(n: number): number[] {
    const bits: number[] = [];
    for (let i = 7; i >= 0; i--) bits.push((n >> i) & 1);
    return bits;
  }

  function pad(n: number): string {
    return n.toString(2).padStart(8, '0');
  }

  function computeBit(op: Operation, bitA: number, bitB: number, fullA: number, bitIndex: number): number {
    switch (op) {
      case 'AND': return bitA & bitB;
      case 'OR': return bitA | bitB;
      case 'XOR': return bitA ^ bitB;
      case 'NOT': return bitA ^ 1;
      case 'LSH': {
        const shifted = (fullA << 1) & 0xFF;
        return (shifted >> (7 - bitIndex)) & 1;
      }
      case 'RSH': {
        const shifted = (fullA >> 1) & 0xFF;
        return (shifted >> (7 - bitIndex)) & 1;
      }
    }
  }

  function computeResult(op: Operation, a: number, b: number): number {
    switch (op) {
      case 'AND': return a & b;
      case 'OR': return a | b;
      case 'XOR': return a ^ b;
      case 'NOT': return (~a) & 0xFF;
      case 'LSH': return (a << 1) & 0xFF;
      case 'RSH': return (a >> 1) & 0xFF;
    }
  }

  function opSymbol(op: Operation): string {
    switch (op) {
      case 'AND': return '&';
      case 'OR': return '|';
      case 'XOR': return '^';
      case 'NOT': return '~';
      case 'LSH': return '<<';
      case 'RSH': return '>>';
    }
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function reset() {
    running = false;
    processingBit = -1;
    resultBits = [null, null, null, null, null, null, null, null];
    log = [];
  }

  async function run() {
    reset();
    running = true;

    const a = clamp(numA);
    const b = clamp(numB);
    const bitsA = toBinary(a);
    const bitsB = toBinary(b);
    const isUnary = operation === 'NOT' || operation === 'LSH' || operation === 'RSH';

    log = [`${opSymbol(operation)} operation on A=${a} (${pad(a)})${isUnary ? '' : `, B=${b} (${pad(b)})`}`];
    await sleep(speed * 2);

    for (let i = 0; i < 8; i++) {
      if (!running) return;
      processingBit = i;
      await sleep(speed);

      const result = computeBit(operation, bitsA[i], bitsB[i], a, i);
      resultBits[i] = result;
      resultBits = [...resultBits];

      if (!isUnary) {
        log = [...log, `Bit ${7 - i}: ${bitsA[i]} ${opSymbol(operation)} ${bitsB[i]} = ${result}`];
      } else if (operation === 'NOT') {
        log = [...log, `Bit ${7 - i}: ~${bitsA[i]} = ${result}`];
      } else {
        log = [...log, `Bit ${7 - i}: ${result}`];
      }

      await sleep(speed);
    }

    processingBit = 8;
    const finalResult = computeResult(operation, a, b);
    log = [...log, `Result: ${finalResult} (${pad(finalResult)})`];
    running = false;
  }

  function bitCellColor(bitIndex: number, value: number | null, isResult: boolean): string {
    if (isResult) {
      if (value === null) return 'var(--muted)';
      return value === 1 ? '#22c55e' : 'var(--muted)';
    }
    if (processingBit === bitIndex) return '#3b82f6';
    return 'var(--muted)';
  }

  const cellSize = 36;
  const cellGap = 4;
  const labelWidth = 80;
  const startX = labelWidth;
  const svgWidth = labelWidth + 8 * (cellSize + cellGap);

  let bitsA = $derived(toBinary(clamp(numA)));
  let bitsB = $derived(toBinary(clamp(numB)));
  let isUnary = $derived(operation === 'NOT' || operation === 'LSH' || operation === 'RSH');
  let sepY = $derived(isUnary ? 62 : 102);
  let resultY = $derived(isUnary ? 70 : 110);
</script>

<div class="space-y-6">
  <!-- Controls -->
  <div class="flex items-center gap-3 flex-wrap">
    {#each operations as op}
      <button
        class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
        class:bg-primary={operation === op.key}
        class:text-primary-foreground={operation === op.key}
        class:border-primary={operation === op.key}
        class:border-border={operation !== op.key}
        class:hover:bg-secondary={operation !== op.key}
        onclick={() => { operation = op.key; reset(); }}
        disabled={running}
      >
        {op.label}
      </button>
    {/each}
  </div>

  <div class="flex items-center gap-4 flex-wrap">
    <label class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">A:</span>
      <input
        type="number"
        min="0"
        max="255"
        bind:value={numA}
        disabled={running}
        class="w-16 rounded border border-border bg-background px-2 py-1 text-sm"
      />
      <span class="font-mono text-xs text-muted-foreground">{pad(clamp(numA))}</span>
    </label>
    {#if !isUnary}
      <label class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground">B:</span>
        <input
          type="number"
          min="0"
          max="255"
          bind:value={numB}
          disabled={running}
          class="w-16 rounded border border-border bg-background px-2 py-1 text-sm"
        />
        <span class="font-mono text-xs text-muted-foreground">{pad(clamp(numB))}</span>
      </label>
    {/if}
    <label class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">Speed:</span>
      <input
        type="range"
        min="50"
        max="500"
        step="50"
        bind:value={speed}
        disabled={running}
        class="w-20"
      />
      <span class="text-xs text-muted-foreground">{speed}ms</span>
    </label>
  </div>

  <div class="flex items-center gap-4">
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      onclick={run}
      disabled={running}
    >
      {running ? 'Running...' : 'Run'}
    </button>
    <button
      class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
      onclick={reset}
      disabled={running}
    >
      Reset
    </button>
  </div>

  <!-- Bit Grid -->
  <svg viewBox="0 0 {svgWidth} {isUnary ? 130 : 170}" class="w-full max-w-lg mx-auto" role="img" aria-label="Bit manipulation visualization">
    <!-- Bit index header -->
    {#each Array(8) as _, i}
      {@const x = startX + i * (cellSize + cellGap)}
      <text
        x={x + cellSize / 2} y="12"
        text-anchor="middle" font-size="9"
        fill="var(--muted-foreground)"
      >
        {7 - i}
      </text>
    {/each}

    <!-- Row A -->
    <text x="4" y="38" font-size="11" font-weight="600" fill="var(--foreground)">
      A = {clamp(numA)}
    </text>
    {#each bitsA as bit, i}
      {@const x = startX + i * (cellSize + cellGap)}
      <rect
        x={x} y="20" width={cellSize} height={cellSize}
        rx="4"
        fill={bitCellColor(i, bit, false)}
        stroke="var(--border)" stroke-width="1.5"
        class="transition-all duration-200"
      />
      <text
        x={x + cellSize / 2} y="44"
        text-anchor="middle" font-size="13" font-weight="600"
        fill="var(--foreground)"
      >
        {bit}
      </text>
    {/each}

    <!-- Row B (only for binary ops) -->
    {#if !isUnary}
      <text x="4" y="78" font-size="11" font-weight="600" fill="var(--foreground)">
        B = {clamp(numB)}
      </text>
      {#each bitsB as bit, i}
        {@const x = startX + i * (cellSize + cellGap)}
        <rect
          x={x} y="60" width={cellSize} height={cellSize}
          rx="4"
          fill={bitCellColor(i, bit, false)}
          stroke="var(--border)" stroke-width="1.5"
          class="transition-all duration-200"
        />
        <text
          x={x + cellSize / 2} y="84"
          text-anchor="middle" font-size="13" font-weight="600"
          fill="var(--foreground)"
        >
          {bit}
        </text>
      {/each}
    {/if}

    <!-- Separator line -->
    <line
      x1={startX} y1={sepY}
      x2={startX + 8 * (cellSize + cellGap) - cellGap} y2={sepY}
      stroke="var(--border)" stroke-width="1" stroke-dasharray="4,3"
    />
    <text x="4" y={sepY - 2} font-size="9" fill="var(--muted-foreground)">
      {opSymbol(operation)}
    </text>

    <!-- Result row -->
    <text x="4" y={resultY + 18} font-size="11" font-weight="600" fill="var(--foreground)">
      {processingBit === 8 ? `= ${computeResult(operation, clamp(numA), clamp(numB))}` : '= ?'}
    </text>
    {#each resultBits as bit, i}
      {@const x = startX + i * (cellSize + cellGap)}
      <rect
        x={x} y={resultY} width={cellSize} height={cellSize}
        rx="4"
        fill={bit !== null ? (bit === 1 ? '#22c55e' : 'var(--muted)') : (processingBit === i ? '#3b82f680' : 'var(--muted)')}
        stroke={processingBit === i ? '#3b82f6' : 'var(--border)'}
        stroke-width={processingBit === i ? 2 : 1.5}
        class="transition-all duration-200"
      />
      <text
        x={x + cellSize / 2} y={resultY + 24}
        text-anchor="middle" font-size="13" font-weight="600"
        fill="var(--foreground)"
      >
        {bit !== null ? bit : ''}
      </text>
    {/each}
  </svg>

  <!-- Legend -->
  <div class="flex flex-wrap gap-4 text-sm">
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500"></span> Processing</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-green-500"></span> Result = 1</span>
    <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-[var(--muted)] border border-border"></span> 0 / Inactive</span>
  </div>

  <!-- Log -->
  {#if log.length > 0}
    <div class="text-sm font-mono space-y-0.5 max-h-40 overflow-y-auto">
      {#each log as entry}
        <p class="text-muted-foreground">{entry}</p>
      {/each}
    </div>
  {/if}
</div>
