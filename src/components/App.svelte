<script lang="ts">
  import { buildManifest, encodeManifest } from '../lib/ManifestBuilder';
  import { generateQrDataUrls } from '../lib/QrEncoder';
  import { PdfNavigator } from '../lib/PdfNavigator';
  import { AudioDetector } from '../lib/AudioDetector';

  type AppState = 'FILE_SELECT' | 'MANIFEST_DISPLAY' | 'CAPTURING' | 'COMPLETE' | 'ERROR';

  let appState = $state<AppState>('FILE_SELECT');
  let errorMessage = $state('');
  let fileInfos = $state<{ name: string; pageCount: number }[]>([]);
  let qrUrls = $state<string[]>([]);
  let qrIndex = $state(0);
  let qrTimer: ReturnType<typeof setInterval> | null = null;
  let navigator: PdfNavigator | null = $state(null);
  let detector: AudioDetector | null = $state(null);
  let canvas: HTMLCanvasElement | undefined = $state(undefined);
  let currentPage = $state(0);
  let totalPages = $state(0);
  let statusText = $state('');

  async function handleFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    try {
      const nav = new PdfNavigator();
      const files = Array.from(input.files);
      fileInfos = await nav.loadFiles(files);
      navigator = nav;
      totalPages = nav.totalPages;

      const manifest = buildManifest(fileInfos);
      const chunks = await encodeManifest(manifest);
      qrUrls = await generateQrDataUrls(chunks);
      qrIndex = 0;

      appState = 'MANIFEST_DISPLAY';
      startQrAutoAdvance();
    } catch (e: any) {
      errorMessage = e.message ?? 'Failed to load PDFs';
      appState = 'ERROR';
    }
  }

  function startQrAutoAdvance() {
    qrTimer = setInterval(() => {
      if (qrIndex < qrUrls.length - 1) {
        qrIndex++;
      } else {
        if (qrTimer) clearInterval(qrTimer);
        qrTimer = null;
      }
    }, 2000);
  }

  async function startCapture() {
    if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }
    appState = 'CAPTURING';

    await renderCurrentPage();

    try {
      detector = new AudioDetector({
        threshold: 0.08,
        silenceThreshold: 0.04,
        onBeepDetected: handleBeep,
      });
      await detector.start();
      statusText = `Page 1/${totalPages} — Listening...`;
    } catch (e: any) {
      errorMessage = 'Microphone required: ' + (e.message ?? 'Permission denied');
      appState = 'ERROR';
    }
  }

  async function renderCurrentPage() {
    if (!navigator || !canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    await navigator.renderPage(canvas);
    const info = navigator.getPageInfo();
    currentPage = info.page;
    statusText = `Page ${info.page}/${info.total}`;
  }

  function handleBeep() {
    if (!navigator) return;

    const hasNext = navigator.next();
    if (hasNext) {
      renderCurrentPage();
    } else {
      detector?.stop();
      detector = null;
      appState = 'COMPLETE';
    }
  }

  function retry() {
    appState = 'FILE_SELECT';
    fileInfos = [];
    qrUrls = [];
    navigator = null;
    detector?.stop();
    detector = null;
    errorMessage = '';
  }
</script>

<div class="w-screen h-screen flex flex-col items-center justify-center text-white font-sans bg-gray-900">
  {#if appState === 'FILE_SELECT'}
    <div class="text-center max-w-2xl px-8">
      <h1 class="text-4xl font-bold mb-4">Silent Blow — Remote</h1>
      <p class="text-gray-400 mb-8">Select PDF files to display for air-gap capture.</p>
      <label class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer text-lg font-medium transition-colors">
        Choose PDFs
        <input type="file" accept=".pdf" multiple onchange={handleFiles} class="hidden" />
      </label>
      {#if fileInfos.length}
        <ul class="list-none mt-6 space-y-2">
          {#each fileInfos as f}
            <li class="text-gray-300">{f.name} — {f.pageCount} pages</li>
          {/each}
        </ul>
      {/if}
    </div>

  {:else if appState === 'MANIFEST_DISPLAY'}
    <div class="text-center">
      <p class="text-xl mb-4 text-gray-400">QR {qrIndex + 1} / {qrUrls.length}</p>
      <img src={qrUrls[qrIndex]} alt="Manifest QR code" class="max-w-[80vmin] max-h-[60vmin] rounded-lg" />
      <p class="mt-4 text-gray-500">Point phone camera at QR codes</p>
      {#if qrIndex === qrUrls.length - 1}
        <button onclick={startCapture} class="mt-6 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xl font-semibold transition-colors">
          START CAPTURE
        </button>
      {/if}
    </div>

  {:else if appState === 'CAPTURING'}
    <canvas bind:this={canvas} class="absolute top-0 left-0 w-screen h-screen"></canvas>
    <div class="fixed top-2 right-3 bg-black/60 text-gray-400 px-4 py-2 rounded-md text-sm z-10">
      {statusText}
    </div>

  {:else if appState === 'COMPLETE'}
    <div class="text-center max-w-2xl px-8">
      <h1 class="text-5xl mb-4">✓</h1>
      <h2 class="text-3xl font-bold mb-4">Capture Complete</h2>
      <p class="text-gray-400 mb-8">{totalPages} pages transmitted</p>
      <button onclick={retry} class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xl font-semibold transition-colors">
        New Session
      </button>
    </div>

  {:else if appState === 'ERROR'}
    <div class="text-center max-w-2xl px-8">
      <h1 class="text-3xl font-bold mb-4 text-red-500">Error</h1>
      <p class="text-gray-300 mb-8">{errorMessage}</p>
      <button onclick={retry} class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xl font-semibold transition-colors">
        Retry
      </button>
    </div>
  {/if}
</div>
