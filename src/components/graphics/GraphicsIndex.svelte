<script lang="ts">
  import Badge from '@/components/ui/badge.svelte';
  import TagFilter from '@/components/dsa/TagFilter.svelte';
  import GraphicsCard from './GraphicsCard.svelte';
  import type {
    GraphicsFamilySection,
    GraphicsLearningPath,
    GraphicsStats,
    GraphicsTopicCardData,
  } from '@/lib/graphics';
  import {
    graphicsKindMeta,
    graphicsKindValues,
    getGraphicsFamilyDescendantIds,
    type GraphicsFamilyId,
    type GraphicsKindId,
  } from '@/lib/graphics-meta';

  export let topics: GraphicsTopicCardData[] = [];
  export let families: GraphicsFamilySection[] = [];
  export let paths: GraphicsLearningPath[] = [];
  export let stats: GraphicsStats;

  type FamilyFilter = 'all' | GraphicsFamilyId;
  type KindFilter = 'all' | GraphicsKindId;
  type PathFilter = 'all' | string;

  let query = '';
  let selectedFamily: FamilyFilter = 'all';
  let selectedKind: KindFilter = 'all';
  let activePathId: PathFilter = 'all';
  let selectedTags: string[] = [];

  const allTags = [...new Set(topics.flatMap(topic => topic.tags))].sort();
  const interactiveCount = topics.filter(topic => topic.visualization).length;

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(candidate => candidate !== tag);
      return;
    }

    selectedTags = [...selectedTags, tag].sort();
  }

  function resetFilters() {
    query = '';
    selectedFamily = 'all';
    selectedKind = 'all';
    activePathId = 'all';
    selectedTags = [];
  }

  function familyMatches(topicFamily: GraphicsFamilyId): boolean {
    if (selectedFamily === 'all') {
      return true;
    }

    return getGraphicsFamilyDescendantIds(selectedFamily).includes(topicFamily);
  }

  function kindMatches(topicKind: GraphicsKindId): boolean {
    return selectedKind === 'all' || selectedKind === topicKind;
  }

  function pathMatches(topic: GraphicsTopicCardData): boolean {
    return activePathId === 'all' || topic.pathIds.includes(activePathId);
  }

  function tagMatches(topic: GraphicsTopicCardData): boolean {
    return selectedTags.length === 0 || selectedTags.every(tag => topic.tags.includes(tag));
  }

  $: normalizedQuery = query.trim().toLowerCase();
  $: activePath = activePathId === 'all'
    ? undefined
    : paths.find(path => path.id === activePathId);
  $: filteredTopics = topics.filter(topic => {
    const queryMatches = normalizedQuery.length === 0 || topic.searchText.includes(normalizedQuery);

    return (
      queryMatches &&
      familyMatches(topic.family) &&
      kindMatches(topic.kind) &&
      pathMatches(topic) &&
      tagMatches(topic)
    );
  });
  $: groupedFamilies = families
    .map(family => ({
      ...family,
      visibleTopics: filteredTopics.filter(topic => topic.family === family.id),
    }))
    .filter(family => family.visibleTopics.length > 0);
  $: resultCount = filteredTopics.length;
  $: familyCounts = Object.fromEntries([
    ['all', topics.filter(topic => kindMatches(topic.kind) && pathMatches(topic) && tagMatches(topic) && (normalizedQuery.length === 0 || topic.searchText.includes(normalizedQuery))).length],
    ...families.map(family => [
      family.id,
      topics.filter(topic => {
        const queryMatches = normalizedQuery.length === 0 || topic.searchText.includes(normalizedQuery);
        return queryMatches && kindMatches(topic.kind) && pathMatches(topic) && tagMatches(topic) && getGraphicsFamilyDescendantIds(family.id).includes(topic.family);
      }).length,
    ]),
  ]) as Record<string, number>;
</script>

<div class="space-y-12">
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Topics</p>
      <p class="text-3xl font-semibold">{stats.totalTopics}</p>
      <p class="mt-2 text-sm text-muted-foreground">Algorithms, operators, and GPU-friendly image-processing building blocks.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Families</p>
      <p class="text-3xl font-semibold">{stats.totalFamilies}</p>
      <p class="mt-2 text-sm text-muted-foreground">Move from continuous filtering into masks, edges, and morphology without losing the thread.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Interactive demos</p>
      <p class="text-3xl font-semibold">{interactiveCount}</p>
      <p class="mt-2 text-sm text-muted-foreground">The atlas pairs the write-up with interactive browser-side playgrounds where a live visual makes the topic click faster.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Learning paths</p>
      <p class="text-3xl font-semibold">{stats.totalPaths}</p>
      <p class="mt-2 text-sm text-muted-foreground">Follow a path when you want a pipeline instead of isolated tricks.</p>
    </div>
  </section>

  <section class="space-y-6 rounded-2xl border border-border bg-card p-6">
    <div class="space-y-3">
      <div>
        <h2 class="text-2xl font-semibold">Navigate the graphics atlas</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Search by algorithm, pipeline role, or tag. Families and paths keep the image-processing story connected instead of flattening it into isolated shader tricks.
        </p>
      </div>

      <label class="block">
        <span class="sr-only">Search graphics topics</span>
        <input
          bind:value={query}
          type="search"
          placeholder="Search graphics algorithms, masks, filters, color, rasterization, or post-processing..."
          class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </label>
    </div>

    <div class="space-y-4">
      <div>
        <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Browse by family</p>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            class={`rounded-2xl border p-4 text-left transition-colors ${selectedFamily === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            on:click={() => { selectedFamily = 'all'; }}
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">All families</h3>
              <Badge variant="secondary" class="text-[11px]">
                {familyCounts.all ?? topics.length}
              </Badge>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">See filtering, segmentation, and morphology together in one map.</p>
          </button>

          {#each families as family}
            <button
              type="button"
              class={`rounded-2xl border p-4 text-left transition-colors ${selectedFamily === family.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              on:click={() => { selectedFamily = selectedFamily === family.id ? 'all' : family.id; }}
            >
              <div class="flex items-center justify-between gap-3">
                <div class="space-y-1">
                  <h3 class="font-semibold">{family.label}</h3>
                  {#if family.note}
                    <p class="text-xs text-muted-foreground">{family.note}</p>
                  {/if}
                </div>
                <Badge variant="secondary" class="text-[11px]">
                  {familyCounts[family.id] ?? 0}
                </Badge>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">{family.description}</p>
            </button>
          {/each}
        </div>
      </div>

      <div>
        <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Topic type</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedKind === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
            on:click={() => { selectedKind = 'all'; }}
          >
            All types
          </button>
          {#each graphicsKindValues as kind}
            <button
              type="button"
              class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedKind === kind ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { selectedKind = selectedKind === kind ? 'all' : kind; }}
            >
              {graphicsKindMeta[kind].label}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Tags</p>
        <TagFilter
          tags={allTags}
          {selectedTags}
          onToggle={toggleTag}
        />
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Curated graphics paths</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Focus on a path to move through a usable pipeline instead of hopping around at random.
        </p>
      </div>

      {#if activePath}
        <button
          type="button"
          class="self-start rounded-full border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
          on:click={() => { activePathId = 'all'; }}
        >
          Clear path focus
        </button>
      {/if}
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      {#each paths as path}
        <div class={`rounded-2xl border p-5 bg-card space-y-4 ${activePathId === path.id ? 'border-primary shadow-sm' : 'border-border'}`}>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold">{path.title}</h3>
              <p class="mt-2 text-sm text-muted-foreground">{path.description}</p>
            </div>
            <button
              type="button"
              class={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${activePathId === path.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { activePathId = activePathId === path.id ? 'all' : path.id; }}
            >
              {activePathId === path.id ? 'Focused' : 'Focus path'}
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            {#each path.steps as step}
              <a
                href={`/graphics/${step.slug}`}
                class={`rounded-full border px-3 py-1.5 text-xs transition-colors ${activePathId === path.id ? 'border-primary/40 bg-primary/5 text-foreground' : 'border-border hover:border-primary/40'}`}
              >
                {step.title}
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Topic map</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? 'topic' : 'topics'} match the current filters.
        </p>
      </div>

      <button
        type="button"
        class="self-start rounded-full border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
        on:click={resetFilters}
      >
        Reset all filters
      </button>
    </div>

    {#if groupedFamilies.length === 0}
      <div class="space-y-3 rounded-2xl border border-dashed border-border p-10 text-center">
        <h3 class="text-lg font-semibold">No graphics topics match the current filters</h3>
        <p class="text-sm text-muted-foreground">
          Try removing a tag, clearing the path focus, or searching for a broader pipeline term.
        </p>
      </div>
    {:else}
      <div class="space-y-10">
        {#each groupedFamilies as family}
          <section class="space-y-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-xl font-semibold">{family.label}</h3>
                  {#if family.note}
                    <Badge variant="secondary" class="text-[11px]">
                      {family.note}
                    </Badge>
                  {/if}
                </div>
                <p class="mt-2 text-sm text-muted-foreground">{family.description}</p>
              </div>
              <p class="text-sm text-muted-foreground">
                {family.visibleTopics.length} {family.visibleTopics.length === 1 ? 'topic' : 'topics'}
              </p>
            </div>

            <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {#each family.visibleTopics as topic (topic.slug)}
                <GraphicsCard {topic} />
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </section>
</div>
