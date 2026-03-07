<script lang="ts">
  import Badge from '@/components/ui/badge.svelte';
  import DsaCard from './DsaCard.svelte';
  import TagFilter from './TagFilter.svelte';
  import type {
    DsaFamilySection,
    DsaLearningPath,
    DsaStats,
    DsaTopicCardData,
  } from '@/lib/dsa';
  import {
    dsaFamilies,
    dsaKindMeta,
    dsaKindValues,
    getFamilyDescendantIds,
    type DsaFamilyId,
    type DsaKindId,
  } from '@/lib/dsa-meta';

  export let topics: DsaTopicCardData[] = [];
  export let families: DsaFamilySection[] = [];
  export let paths: DsaLearningPath[] = [];
  export let stats: DsaStats;

  type FamilyFilter = 'all' | DsaFamilyId;
  type KindFilter = 'all' | DsaKindId;
  type PathFilter = 'all' | string;

  let query = '';
  let selectedFamily: FamilyFilter = 'all';
  let selectedKind: KindFilter = 'all';
  let activePathId: PathFilter = 'all';
  let selectedTags: string[] = [];

  const allTags = [...new Set(topics.flatMap(topic => topic.tags))].sort();

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(candidate => candidate !== tag);
      return;
    }

    selectedTags = [...selectedTags, tag];
  }

  function resetFilters() {
    query = '';
    selectedFamily = 'all';
    selectedKind = 'all';
    activePathId = 'all';
    selectedTags = [];
  }

  function familyMatches(topicFamily: DsaFamilyId): boolean {
    if (selectedFamily === 'all') {
      return true;
    }

    return getFamilyDescendantIds(selectedFamily).includes(topicFamily);
  }

  function kindMatches(topicKind: DsaKindId): boolean {
    return selectedKind === 'all' || selectedKind === topicKind;
  }

  function pathMatches(topic: DsaTopicCardData): boolean {
    return activePathId === 'all' || topic.pathIds.includes(activePathId);
  }

  function tagMatches(topic: DsaTopicCardData): boolean {
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
</script>

<div class="space-y-12">
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Topics</p>
      <p class="text-3xl font-semibold">{stats.totalTopics}</p>
      <p class="text-sm text-muted-foreground mt-2">Every topic is linked by family, prerequisites, and what it unlocks.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Families</p>
      <p class="text-3xl font-semibold">{stats.totalFamilies}</p>
      <p class="text-sm text-muted-foreground mt-2">Trees sit under graphs, so conceptual navigation mirrors the underlying theory.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Algorithms</p>
      <p class="text-3xl font-semibold">{stats.totalAlgorithms}</p>
      <p class="text-sm text-muted-foreground mt-2">Traverse, search, sort, and optimize with clear follow-up suggestions.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Learning paths</p>
      <p class="text-3xl font-semibold">{stats.totalPaths}</p>
      <p class="text-sm text-muted-foreground mt-2">Curated routes help you move from fundamentals to more specialized topics.</p>
    </div>
  </section>

  <section class="rounded-2xl border border-border bg-card p-6 space-y-6">
    <div class="space-y-3">
      <div>
        <h2 class="text-2xl font-semibold">Navigate the DSA atlas</h2>
        <p class="text-sm text-muted-foreground mt-2">
          Filter by family, topic type, tags, or path. Selecting
          <span class="font-medium text-foreground">Graphs</span>
          also keeps
          <span class="font-medium text-foreground">Trees</span>
          visible because trees are constrained graphs.
        </p>
      </div>

      <label class="block">
        <span class="sr-only">Search DSA topics</span>
        <input
          bind:value={query}
          type="search"
          placeholder="Search topics, dependencies, tags, or what a concept unlocks..."
          class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </label>
    </div>

    <div class="space-y-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Browse by family</p>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <button
            class={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${selectedFamily === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            on:click={() => { selectedFamily = 'all'; }}
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">All families</h3>
              <Badge variant="secondary" class="text-[11px]">
                {topics.length}
              </Badge>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">See the full map across structures, algorithms, and strategies.</p>
          </button>

          {#each families as family}
            <button
              class={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${selectedFamily === family.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              on:click={() => { selectedFamily = family.id; }}
            >
              <div class="flex items-center justify-between gap-3">
                <div class="space-y-1">
                  <h3 class="font-semibold">{family.label}</h3>
                  {#if family.note}
                    <p class="text-xs text-muted-foreground">{family.note}</p>
                  {/if}
                </div>
                <Badge variant="secondary" class="text-[11px]">
                  {family.topicCount}
                </Badge>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">{family.description}</p>
            </button>
          {/each}
        </div>
      </div>

      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Topic type</p>
        <div class="flex flex-wrap gap-2">
          <button
            class={`rounded-full border px-3 py-2 text-sm transition-colors cursor-pointer ${selectedKind === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
            on:click={() => { selectedKind = 'all'; }}
          >
            All types
          </button>
          {#each dsaKindValues as kind}
            <button
              class={`rounded-full border px-3 py-2 text-sm transition-colors cursor-pointer ${selectedKind === kind ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { selectedKind = kind; }}
            >
              {dsaKindMeta[kind].label}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Tags</p>
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
        <h2 class="text-2xl font-semibold">Curated learning paths</h2>
        <p class="text-sm text-muted-foreground mt-2">
          Focus on a path to shrink the grid to a coherent sequence instead of a flat list.
        </p>
      </div>

      {#if activePath}
        <button
          class="self-start rounded-full border border-border px-3 py-2 text-sm hover:border-primary/40 transition-colors cursor-pointer"
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
              <p class="text-sm text-muted-foreground mt-2">{path.description}</p>
            </div>
            <button
              class={`rounded-full border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${activePathId === path.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { activePathId = activePathId === path.id ? 'all' : path.id; }}
            >
              {activePathId === path.id ? 'Focused' : 'Focus path'}
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            {#each path.steps as step}
              <a
                href={`/dsa/${step.slug}`}
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
        <p class="text-sm text-muted-foreground mt-2">
          {resultCount} {resultCount === 1 ? 'topic' : 'topics'}
          {#if selectedFamily !== 'all'}
            in
            <span class="font-medium text-foreground">{dsaFamilies[selectedFamily].label}</span>
          {/if}
          {#if activePath}
            on the
            <span class="font-medium text-foreground">{activePath.title}</span>
            path
          {/if}
          match the current filters.
        </p>
      </div>

      <button
        class="self-start rounded-full border border-border px-3 py-2 text-sm hover:border-primary/40 transition-colors cursor-pointer"
        on:click={resetFilters}
      >
        Reset all filters
      </button>
    </div>

    {#if groupedFamilies.length === 0}
      <div class="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
        <h3 class="text-lg font-semibold">No topics match the current filters</h3>
        <p class="text-sm text-muted-foreground">
          Try clearing one of the filters or search with a broader term.
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
                <p class="text-sm text-muted-foreground mt-2">
                  {family.description}
                </p>
              </div>
              <p class="text-sm text-muted-foreground">
                {family.visibleTopics.length} {family.visibleTopics.length === 1 ? 'topic' : 'topics'}
              </p>
            </div>

            <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {#each family.visibleTopics as topic (topic.slug)}
                <DsaCard {topic} />
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </section>
</div>
