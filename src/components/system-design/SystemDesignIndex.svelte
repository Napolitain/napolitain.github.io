<script lang="ts">
  import { onMount } from 'svelte';

  import Badge from '@/components/ui/badge.svelte';
  import TagFilter from '@/components/dsa/TagFilter.svelte';
  import type {
    SystemDesignFamilySection,
    SystemDesignLearningPath,
    SystemDesignStats,
    SystemDesignTopicCardData,
  } from '@/lib/system-design';
  import {
    getSystemDesignFamilyDescendantIds,
    systemDesignDifficultyMeta,
    systemDesignDifficultyValues,
    systemDesignFamilies,
    systemDesignKindMeta,
    systemDesignKindValues,
    type SystemDesignDifficultyId,
    type SystemDesignFamilyId,
    type SystemDesignKindId,
  } from '@/lib/system-design-meta';

  import SystemDesignCard from './SystemDesignCard.svelte';

  export let topics: SystemDesignTopicCardData[] = [];
  export let families: SystemDesignFamilySection[] = [];
  export let paths: SystemDesignLearningPath[] = [];
  export let stats: SystemDesignStats;

  type FamilyFilter = 'all' | SystemDesignFamilyId;
  type KindFilter = 'all' | SystemDesignKindId;
  type DifficultyFilter = 'all' | SystemDesignDifficultyId;
  type PathFilter = 'all' | string;

  let query = '';
  let selectedFamily: FamilyFilter = 'all';
  let selectedKind: KindFilter = 'all';
  let selectedDifficulty: DifficultyFilter = 'all';
  let activePathId: PathFilter = 'all';
  let selectedTags: string[] = [];
  let normalizedQuery = '';
  let queryTokens: string[] = [];
  let activePath: SystemDesignLearningPath | undefined;
  let filteredTopics: SystemDesignTopicCardData[] = [];
  let resultCount = 0;
  let hasActiveFilters = false;
  let hasMounted = false;
  let familyCounts: Record<string, number> = {};
  let kindCounts: Record<string, number> = {};
  let difficultyCounts: Record<string, number> = {};
  let pathCounts: Record<string, number> = {};

  const allTags = [...new Set(topics.flatMap(topic => topic.tags))].sort();

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(candidate => candidate !== tag);
      return;
    }

    selectedTags = [...selectedTags, tag].sort();
  }

  function clearQuery() {
    query = '';
  }

  function setFamilyFilter(family: FamilyFilter) {
    selectedFamily = selectedFamily === family ? 'all' : family;
  }

  function setKindFilter(kind: KindFilter) {
    selectedKind = selectedKind === kind ? 'all' : kind;
  }

  function setDifficultyFilter(difficulty: DifficultyFilter) {
    selectedDifficulty = selectedDifficulty === difficulty ? 'all' : difficulty;
  }

  function setPathFocus(pathId: string) {
    activePathId = activePathId === pathId ? 'all' : pathId;
  }

  function resetFilters() {
    query = '';
    selectedFamily = 'all';
    selectedKind = 'all';
    selectedDifficulty = 'all';
    activePathId = 'all';
    selectedTags = [];
  }

  function familyFilterMatches(filter: FamilyFilter, topicFamily: SystemDesignFamilyId): boolean {
    if (filter === 'all') {
      return true;
    }

    return getSystemDesignFamilyDescendantIds(filter).includes(topicFamily);
  }

  function kindFilterMatches(filter: KindFilter, topicKind: SystemDesignKindId): boolean {
    return filter === 'all' || filter === topicKind;
  }

  function difficultyFilterMatches(filter: DifficultyFilter, topicDifficulty: SystemDesignDifficultyId): boolean {
    return filter === 'all' || filter === topicDifficulty;
  }

  function pathFilterMatches(filter: PathFilter, topic: SystemDesignTopicCardData): boolean {
    return filter === 'all' || topic.pathIds.includes(filter);
  }

  function tagMatches(topic: SystemDesignTopicCardData): boolean {
    return selectedTags.length === 0 || selectedTags.every(tag => topic.tags.includes(tag));
  }

  function queryMatches(topic: SystemDesignTopicCardData): boolean {
    return queryTokens.length === 0 || queryTokens.every(token => topic.searchText.includes(token));
  }

  function matchesCurrentFilters(topic: SystemDesignTopicCardData): boolean {
    return (
      queryMatches(topic) &&
      familyFilterMatches(selectedFamily, topic.family) &&
      kindFilterMatches(selectedKind, topic.kind) &&
      difficultyFilterMatches(selectedDifficulty, topic.difficulty) &&
      pathFilterMatches(activePathId, topic) &&
      tagMatches(topic)
    );
  }

  function countMatchingTopics(
    {
      family = selectedFamily,
      kind = selectedKind,
      difficulty = selectedDifficulty,
      path = activePathId,
    }: {
      family?: FamilyFilter;
      kind?: KindFilter;
      difficulty?: DifficultyFilter;
      path?: PathFilter;
    } = {},
  ): number {
    return topics.filter(topic => (
      queryMatches(topic) &&
      familyFilterMatches(family, topic.family) &&
      kindFilterMatches(kind, topic.kind) &&
      difficultyFilterMatches(difficulty, topic.difficulty) &&
      pathFilterMatches(path, topic) &&
      tagMatches(topic)
    )).length;
  }

  function isValidFamilyFilter(value: string | null): value is SystemDesignFamilyId {
    return Boolean(value) && Object.prototype.hasOwnProperty.call(systemDesignFamilies, value);
  }

  function isValidKindFilter(value: string | null): value is SystemDesignKindId {
    return Boolean(value) && systemDesignKindValues.includes(value as SystemDesignKindId);
  }

  function isValidDifficultyFilter(value: string | null): value is SystemDesignDifficultyId {
    return Boolean(value) && systemDesignDifficultyValues.includes(value as SystemDesignDifficultyId);
  }

  function isValidPathFilter(value: string | null): value is string {
    return Boolean(value) && paths.some(path => path.id === value);
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get('q');

    if (nextQuery) {
      query = nextQuery;
    }

    const family = params.get('family');
    if (isValidFamilyFilter(family)) {
      selectedFamily = family;
    }

    const kind = params.get('kind');
    if (isValidKindFilter(kind)) {
      selectedKind = kind;
    }

    const difficulty = params.get('difficulty');
    if (isValidDifficultyFilter(difficulty)) {
      selectedDifficulty = difficulty;
    }

    const path = params.get('path');
    if (isValidPathFilter(path)) {
      activePathId = path;
    }

    const tags = params.getAll('tag').filter(tag => allTags.includes(tag));
    if (tags.length > 0) {
      selectedTags = [...new Set(tags)].sort();
    }

    hasMounted = true;
  });

  $: normalizedQuery = query.trim().toLowerCase();
  $: queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  $: activePath = activePathId === 'all'
    ? undefined
    : paths.find(path => path.id === activePathId);
  $: filteredTopics = topics.filter(matchesCurrentFilters);
  $: resultCount = filteredTopics.length;
  $: hasActiveFilters = (
    normalizedQuery.length > 0 ||
    selectedFamily !== 'all' ||
    selectedKind !== 'all' ||
    selectedDifficulty !== 'all' ||
    activePathId !== 'all' ||
    selectedTags.length > 0
  );
  $: familyCounts = Object.fromEntries([
    ['all', countMatchingTopics({ family: 'all' })],
    ...families.map(family => [family.id, countMatchingTopics({ family: family.id })]),
  ]) as Record<string, number>;
  $: kindCounts = Object.fromEntries([
    ['all', countMatchingTopics({ kind: 'all' })],
    ...systemDesignKindValues.map(kind => [kind, countMatchingTopics({ kind })]),
  ]) as Record<string, number>;
  $: difficultyCounts = Object.fromEntries([
    ['all', countMatchingTopics({ difficulty: 'all' })],
    ...systemDesignDifficultyValues.map(level => [level, countMatchingTopics({ difficulty: level })]),
  ]) as Record<string, number>;
  $: pathCounts = Object.fromEntries(
    paths.map(path => [path.id, countMatchingTopics({ path: path.id })]),
  ) as Record<string, number>;

  $: if (hasMounted) {
    const params = new URLSearchParams();

    if (normalizedQuery.length > 0) {
      params.set('q', query.trim());
    }
    if (selectedFamily !== 'all') {
      params.set('family', selectedFamily);
    }
    if (selectedKind !== 'all') {
      params.set('kind', selectedKind);
    }
    if (selectedDifficulty !== 'all') {
      params.set('difficulty', selectedDifficulty);
    }
    if (activePathId !== 'all') {
      params.set('path', activePathId);
    }
    for (const tag of [...selectedTags].sort()) {
      params.append('tag', tag);
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch.length > 0 ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }
</script>

<div class="space-y-12">
  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Deep dives</p>
      <p class="text-3xl font-semibold">{stats.totalTopics}</p>
      <p class="mt-2 text-sm text-muted-foreground">Production-focused write-ups that stay concrete about APIs, storage, and failure handling.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Families</p>
      <p class="text-3xl font-semibold">{stats.totalFamilies}</p>
      <p class="mt-2 text-sm text-muted-foreground">Follow topics by system concern instead of treating every interview design as an isolated whiteboard prompt.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">End-to-end designs</p>
      <p class="text-3xl font-semibold">{stats.totalDesigns}</p>
      <p class="mt-2 text-sm text-muted-foreground">These pages optimize for production architecture, not just naming the right buzzwords in an interview.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Learning paths</p>
      <p class="text-3xl font-semibold">{stats.totalPaths}</p>
      <p class="mt-2 text-sm text-muted-foreground">Curated sequences keep the next deep technical topic obvious as the atlas expands.</p>
    </div>
  </section>

  <section class="space-y-6 rounded-2xl border border-border bg-card p-6">
    <div class="space-y-3">
      <div>
        <h2 class="text-2xl font-semibold">Navigate the system design atlas</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Search by mechanism, focus by family, and keep the current slice in the URL so it is easy to reopen the same learning thread later.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="block flex-1">
          <span class="sr-only">Search system design topics</span>
          <input
            bind:value={query}
            type="search"
            placeholder="Search for token bucket, quotas, multi-region, Redis, control plane, abuse, or failure modes..."
            class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        {#if normalizedQuery.length > 0}
          <button
            type="button"
            class="self-start rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40"
            on:click={clearQuery}
          >
            Clear search
          </button>
        {/if}
      </div>

      {#if hasActiveFilters}
        <div class="flex flex-wrap gap-2">
          {#if normalizedQuery.length > 0}
            <Badge variant="secondary" class="text-[11px]">
              Search: "{query.trim()}"
            </Badge>
          {/if}
          {#if selectedFamily !== 'all'}
            <Badge variant="secondary" class="text-[11px]">
              Family: {systemDesignFamilies[selectedFamily].label}
            </Badge>
          {/if}
          {#if selectedKind !== 'all'}
            <Badge variant="secondary" class="text-[11px]">
              Type: {systemDesignKindMeta[selectedKind].label}
            </Badge>
          {/if}
          {#if selectedDifficulty !== 'all'}
            <Badge variant="secondary" class="text-[11px]">
              Difficulty: {systemDesignDifficultyMeta[selectedDifficulty].label}
            </Badge>
          {/if}
          {#if activePath}
            <Badge variant="secondary" class="text-[11px]">
              Path: {activePath.title}
            </Badge>
          {/if}
          {#each selectedTags as tag}
            <Badge variant="secondary" class="text-[11px]">
              Tag: {tag}
            </Badge>
          {/each}
        </div>
      {/if}
    </div>

    <div class="space-y-5">
      <div>
        <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Browse by family</p>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            aria-pressed={selectedFamily === 'all'}
            class={`rounded-2xl border p-4 text-left transition-colors ${selectedFamily === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            on:click={() => { setFamilyFilter('all'); }}
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">All families</h3>
              <Badge variant="secondary" class="text-[11px]">
                {familyCounts.all ?? topics.length}
              </Badge>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">See the whole track across policy, enforcement, reliability, and operations.</p>
          </button>

          {#each families as family}
            <button
              type="button"
              aria-pressed={selectedFamily === family.id}
              class={`rounded-2xl border p-4 text-left transition-colors ${selectedFamily === family.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              on:click={() => { setFamilyFilter(family.id); }}
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

      <div class="space-y-4">
        <div>
          <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Topic type</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={selectedKind === 'all'}
              class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedKind === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { setKindFilter('all'); }}
            >
              All types
              <span class="ml-2 text-xs opacity-80">{kindCounts.all ?? topics.length}</span>
            </button>
            {#each systemDesignKindValues as kind}
              <button
                type="button"
                aria-pressed={selectedKind === kind}
                class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedKind === kind ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
                on:click={() => { setKindFilter(kind); }}
              >
                {systemDesignKindMeta[kind].label}
                <span class="ml-2 text-xs opacity-80">{kindCounts[kind] ?? 0}</span>
              </button>
            {/each}
          </div>
        </div>

        <div>
          <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Difficulty</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={selectedDifficulty === 'all'}
              class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedDifficulty === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { setDifficultyFilter('all'); }}
            >
              All levels
              <span class="ml-2 text-xs opacity-80">{difficultyCounts.all ?? topics.length}</span>
            </button>
            {#each systemDesignDifficultyValues as level}
              <button
                type="button"
                aria-pressed={selectedDifficulty === level}
                class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedDifficulty === level ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
                on:click={() => { setDifficultyFilter(level); }}
              >
                {systemDesignDifficultyMeta[level].label}
                <span class="ml-2 text-xs opacity-80">{difficultyCounts[level] ?? 0}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      {#if paths.length > 0}
        <div>
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curated paths</p>
            {#if activePath}
              <button
                type="button"
                class="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                on:click={() => { activePathId = 'all'; }}
              >
                Clear path focus
              </button>
            {/if}
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            {#each paths as path}
              <button
                type="button"
                aria-pressed={activePathId === path.id}
                class={`rounded-2xl border p-5 text-left transition-colors ${activePathId === path.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                on:click={() => { setPathFocus(path.id); }}
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-lg font-semibold">{path.title}</h3>
                    <p class="mt-2 text-sm text-muted-foreground">{path.description}</p>
                  </div>
                  <Badge variant="secondary" class="text-[11px]">
                    {pathCounts[path.id] ?? 0}
                  </Badge>
                </div>

                {#if path.steps.length > 0}
                  <div class="mt-4 flex flex-wrap gap-2">
                    {#each path.steps as step}
                      <span class="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                        {step.title}
                      </span>
                    {/each}
                  </div>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if allTags.length > 0}
        <div>
          <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Tags</p>
          <TagFilter tags={allTags} selectedTags={selectedTags} onToggle={toggleTag} />
        </div>
      {/if}
    </div>
  </section>

  <section class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">System design topics</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          {resultCount}
          {' '}
          matching topic{resultCount === 1 ? '' : 's'}
          {activePath ? ` in ${activePath.title}` : ''}
          .
        </p>
      </div>

      {#if hasActiveFilters}
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
          on:click={resetFilters}
        >
          Reset filters
        </button>
      {/if}
    </div>

    {#if filteredTopics.length === 0}
      <div class="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h3 class="text-lg font-semibold">No topics match that slice yet</h3>
        <p class="mt-2 text-sm text-muted-foreground">
          Try clearing a few filters or searching for broader concepts like quotas, tokens, control plane, or multi-region.
        </p>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each filteredTopics as topic}
          <SystemDesignCard {topic} />
        {/each}
      </div>
    {/if}
  </section>
</div>
