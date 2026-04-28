<script lang="ts">
  import { onMount } from 'svelte';

  declare global {
    interface Window {
      PagefindUI?: new (options: Record<string, unknown>) => PagefindUIInstance;
    }
  }

  interface PagefindUIInstance {
    triggerSearch: (term: string) => void;
    destroy?: () => void;
  }

  export let initialQuery = '';

  let loadError = '';
  let pagefind: PagefindUIInstance | undefined;

  function getRequestedQuery(): string {
    const urlQuery = new URLSearchParams(window.location.search).get('q')?.trim();
    return urlQuery && urlQuery.length > 0 ? urlQuery : initialQuery.trim();
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

  function updateQueryParam(value: string) {
    const params = new URLSearchParams(window.location.search);
    const trimmed = value.trim();

    if (trimmed.length > 0) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }

  function focusAndBindInput(searchTerm: string, retries = 0) {
    const input = document.querySelector<HTMLInputElement>('#pagefind-discovery .pagefind-ui__search-input');

    if (!input) {
      if (retries < 20) {
        window.setTimeout(() => focusAndBindInput(searchTerm, retries + 1), 100);
      }
      return;
    }

    input.focus();
    if (input.dataset.discoveryBound !== 'true') {
      input.addEventListener('input', () => updateQueryParam(input.value));
      input.dataset.discoveryBound = 'true';
    }

    if (searchTerm.length > 0 && input.value !== searchTerm) {
      input.value = searchTerm;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  onMount(() => {
    void (async () => {
      ensureStylesheet('/pagefind/pagefind-ui.css', 'data-pagefind-search-page-style');
      const requestedQuery = getRequestedQuery();

      try {
        await loadScript('/pagefind/pagefind-ui.js', 'data-pagefind-search-page-script');

        if (!window.PagefindUI) {
          throw new Error('Pagefind UI did not initialize.');
        }

        pagefind = new window.PagefindUI({
          element: '#pagefind-discovery',
          showSubResults: true,
          showImages: false,
        });

        focusAndBindInput(requestedQuery);
        if (requestedQuery.length > 0) {
          window.setTimeout(() => {
            pagefind?.triggerSearch(requestedQuery);
            focusAndBindInput(requestedQuery);
          }, 100);
        }
      } catch (error) {
        loadError = error instanceof Error ? error.message : 'Failed to load search.';
      }
    })();

    return () => {
      pagefind?.destroy?.();
    };
  });
</script>

<section class="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
  <div class="space-y-4 mb-6">
    <p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">Unified search</p>
    <h2 class="text-2xl md:text-3xl font-semibold text-foreground">Search posts, atlases, and demos together</h2>
    <p class="max-w-3xl text-sm md:text-base text-muted-foreground">
      This page uses the same Pagefind index as the keyboard search modal, but keeps the results visible so you can browse, refine, and jump between system design, DSA, graphics, blog posts, and demos without losing context.
    </p>
  </div>

  {#if loadError}
    <div class="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
      {loadError}
    </div>
  {:else}
    <div id="pagefind-discovery"></div>
  {/if}
</section>

<style>
  :global(#pagefind-discovery .pagefind-ui__search-input) {
    background: var(--card) !important;
    color: var(--foreground) !important;
    border: 1px solid var(--border) !important;
    border-radius: 0.75rem !important;
    padding: 0.9rem 1rem !important;
    font-size: 1rem !important;
  }

  :global(#pagefind-discovery .pagefind-ui__result-link) {
    color: var(--primary) !important;
  }

  :global(#pagefind-discovery .pagefind-ui__result-excerpt),
  :global(#pagefind-discovery .pagefind-ui__message) {
    color: var(--muted-foreground) !important;
  }

  :global(#pagefind-discovery .pagefind-ui__button) {
    background: var(--secondary) !important;
    color: var(--secondary-foreground) !important;
    border: 1px solid var(--border) !important;
  }
 </style>
