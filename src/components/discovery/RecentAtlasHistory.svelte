<script lang="ts">
  import { onMount } from 'svelte';

  import type { AtlasHistoryItem, AtlasHistoryItemInput } from '@/lib/discovery';
  import { createAtlasHistoryItem } from '@/lib/discovery';

  const STORAGE_KEY = 'atlas-recent-history';

  export let title = 'Recently viewed atlas topics';
  export let description = 'Jump back into the last DSA, system design, and graphics topics you opened.';
  export let section: 'all' | 'dsa' | 'graphics' | 'system-design' = 'all';
  export let currentItem: AtlasHistoryItemInput | undefined;
  export let limit = 6;

  let items: AtlasHistoryItem[] = [];
  let mounted = false;

  function readHistory(): AtlasHistoryItem[] {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as AtlasHistoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeHistory(nextItems: AtlasHistoryItem[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  }

  onMount(() => {
    let nextItems = readHistory();

    if (currentItem) {
      const recordedItem = createAtlasHistoryItem(currentItem);
      nextItems = [
        recordedItem,
        ...nextItems.filter(item => item.href !== recordedItem.href),
      ].slice(0, limit + 1);
      writeHistory(nextItems);
    }

    items = nextItems
      .filter(item => item.href !== currentItem?.href)
      .filter(item => section === 'all' || item.section === section)
      .slice(0, limit);
    mounted = true;
  });
</script>

{#if mounted && items.length > 0}
  <section data-testid="recent-atlas-history" class="rounded-2xl border border-border bg-card p-5 space-y-4">
    <div class="space-y-2">
      <h2 class="text-lg font-semibold text-foreground">{title}</h2>
      <p class="text-sm text-muted-foreground">{description}</p>
    </div>

    <ul class="space-y-3">
      {#each items as item}
        <li>
          <a
            href={item.href}
            class="group flex flex-col gap-2 rounded-xl border border-border/80 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {item.sectionLabel}
              </span>
            </div>
            <span class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </section>
{/if}
