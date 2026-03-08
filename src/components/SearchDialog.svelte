<script lang="ts">
  let open = $state(false);
  let loaded = $state(false);

  function openSearch() {
    if (!loaded) {
      // Dynamically load Pagefind
      const script = document.createElement('script');
      script.src = '/pagefind/pagefind-ui.js';
      script.onload = () => {
        loaded = true;
        open = true;
        initPagefind();
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/pagefind/pagefind-ui.css';
      document.head.appendChild(link);
    } else {
      open = true;
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
        input?.focus();
      }, 50);
    }
  }

  function closeSearch() {
    open = false;
  }

  function initPagefind() {
    setTimeout(() => {
      // @ts-ignore — Pagefind is loaded dynamically
      if (window.PagefindUI) {
        // @ts-ignore
        new window.PagefindUI({
          element: '#pagefind-container',
          showSubResults: true,
          showImages: false,
        });
        const input = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
        input?.focus();
      }
    }, 50);
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
