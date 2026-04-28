<script lang="ts">
  import { tick } from 'svelte';

  declare global {
    interface Window {
      PagefindUI?: new (options: Record<string, unknown>) => PagefindUIInstance;
    }
  }

  interface PagefindUIInstance {
    destroy?: () => void;
  }

  let open = $state(false);
  let loaded = $state(false);
  let pagefind: PagefindUIInstance | undefined;

  function ensureStylesheet(href: string, attributeName: string) {
    if (document.querySelector(`link[${attributeName}="true"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(attributeName, 'true');
    document.head.appendChild(link);
  }

  function loadScript(src: string, attributeName: string) {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[${attributeName}="true"]`);

      if (existing) {
        if (window.PagefindUI) {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute(attributeName, 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function focusInput(retries = 0) {
    const input = document.querySelector<HTMLInputElement>('#pagefind-container .pagefind-ui__search-input');

    if (input) {
      input.focus();
      return;
    }

    if (retries < 20) {
      window.setTimeout(() => focusInput(retries + 1), 100);
    }
  }

  async function initPagefind() {
    await tick();

    const container = document.querySelector<HTMLElement>('#pagefind-container');
    if (!container || !window.PagefindUI) {
      return;
    }

    pagefind?.destroy?.();
    container.innerHTML = '';

    pagefind = new window.PagefindUI({
      element: '#pagefind-container',
      showSubResults: true,
      showImages: false,
    });

    focusInput();
  }

  async function openSearch() {
    ensureStylesheet('/pagefind/pagefind-ui.css', 'data-pagefind-search-dialog-style');

    if (!loaded) {
      await loadScript('/pagefind/pagefind-ui.js', 'data-pagefind-search-dialog-script');
      loaded = true;
    }

    open = true;
    await initPagefind();
  }

  function closeSearch() {
    open = false;
    pagefind?.destroy?.();
    pagefind = undefined;
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (open) closeSearch();
      else openSearch();
    }
    if (e.key === 'Escape' && open) {
      closeSearch();
    }
  }

  $effect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<!-- Search trigger button -->
<button
  onclick={openSearch}
  class="fixed top-4 right-16 z-40 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
  aria-label="Search (Ctrl+K)"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
  <span class="hidden sm:inline">Search</span>
  <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-secondary rounded border border-border">
    <span class="text-xs">⌘</span>K
  </kbd>
</button>

<!-- Search modal -->
{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
    onmousedown={(e) => { if (e.target === e.currentTarget) closeSearch(); }}
    onkeydown={(e) => { if (e.key === 'Escape') closeSearch(); }}
  >
    <div class="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden mx-4">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <span class="text-sm font-medium text-foreground">Search</span>
        <button onclick={closeSearch} class="text-muted-foreground hover:text-foreground text-sm">
          <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-secondary rounded border border-border">ESC</kbd>
        </button>
      </div>
      <div id="pagefind-container" class="p-4 max-h-[60vh] overflow-y-auto"></div>
      <div class="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
        <span class="text-muted-foreground">Need more room for discovery?</span>
        <a href="/search" class="font-medium text-primary hover:underline">Open the full search page</a>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.pagefind-ui__search-input) {
    background: var(--card) !important;
    color: var(--foreground) !important;
    border: 1px solid var(--border) !important;
    border-radius: 0.5rem !important;
    padding: 0.75rem 1rem !important;
    font-size: 1rem !important;
  }

  :global(.pagefind-ui__result-link) {
    color: var(--primary) !important;
  }

  :global(.pagefind-ui__result-excerpt) {
    color: var(--muted-foreground) !important;
  }

  :global(.pagefind-ui__message) {
    color: var(--muted-foreground) !important;
  }

  :global(.pagefind-ui__button) {
    background: var(--secondary) !important;
    color: var(--secondary-foreground) !important;
    border: 1px solid var(--border) !important;
  }
</style>
