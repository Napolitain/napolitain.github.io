<script lang="ts">
  import { onMount } from 'svelte';

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
    dsaDifficultyMeta,
    dsaDifficultyValues,
    dsaFamilies,
    dsaKindMeta,
    dsaKindValues,
    getFamilyDescendantIds,
    type DsaDifficultyId,
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
  type GroupMode = 'family' | 'kind' | 'difficulty' | 'flat';

  interface ResultGroup {
    id: string;
    label: string;
    description: string;
    note?: string;
    visibleTopics: DsaTopicCardData[];
  }

  let query = '';
  let selectedFamily: FamilyFilter = 'all';
  let selectedKind: KindFilter = 'all';
  let activePathId: PathFilter = 'all';
  let selectedTags: string[] = [];
  let groupMode: GroupMode = 'family';
  let normalizedQuery = '';
  let queryTokens: string[] = [];
  let activePath: DsaLearningPath | undefined;
  let filteredTopics: DsaTopicCardData[] = [];
  let resultGroups: ResultGroup[] = [];
  let resultCount = 0;
  let hasActiveFilters = false;
  let familyCounts: Record<string, number> = {};
  let kindCounts: Record<string, number> = {};
  let pathCounts: Record<string, number> = {};
  let hasMounted = false;

  const allTags = [...new Set(topics.flatMap(topic => topic.tags))].sort();
  const groupModes: GroupMode[] = ['family', 'kind', 'difficulty', 'flat'];
  const groupModeMeta: Record<GroupMode, { label: string; description: string }> = {
    family: {
      label: 'Family',
      description: 'Keep the atlas grouped by conceptual families so parent-child relationships stay visible.',
    },
    kind: {
      label: 'Topic type',
      description: 'Split the result set into concepts, data structures, algorithms, and techniques.',
    },
    difficulty: {
      label: 'Difficulty',
      description: 'Separate the intro pages from the intermediate and advanced follow-ups.',
    },
    flat: {
      label: 'Flat list',
      description: 'Best when search is already doing the narrowing and you just want the matches.',
    },
  };
  const kindGroupDescriptions: Record<DsaKindId, string> = {
    concept: 'Mental models and framing pages that explain the shape of a problem space.',
    'data-structure': 'Containers and indexes that organize data so later operations become cheap.',
    algorithm: 'Step-by-step procedures that process, traverse, or optimize over structured data.',
    technique: 'Reusable transformations or tactics that turn hard problems into manageable ones.',
  };
  const difficultyGroupDescriptions: Record<DsaDifficultyId, string> = {
    intro: 'Good starting points when you want the core idea without much prerequisite baggage.',
    intermediate: 'Needs some context, but still belongs in the main working toolkit for interviews and practice.',
    advanced: 'More specialized pages for heavy query workloads, deeper theory, or systems-scale trade-offs.',
  };

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

  function setPathFocus(pathId: string) {
    activePathId = activePathId === pathId ? 'all' : pathId;
  }

  function resetFilters() {
    query = '';
    selectedFamily = 'all';
    selectedKind = 'all';
    activePathId = 'all';
    selectedTags = [];
  }

  function familyFilterMatches(filter: FamilyFilter, topicFamily: DsaFamilyId): boolean {
    if (filter === 'all') {
      return true;
    }

    return getFamilyDescendantIds(filter).includes(topicFamily);
  }

  function familyMatches(topicFamily: DsaFamilyId): boolean {
    return familyFilterMatches(selectedFamily, topicFamily);
  }

  function kindFilterMatches(filter: KindFilter, topicKind: DsaKindId): boolean {
    return filter === 'all' || filter === topicKind;
  }

  function kindMatches(topicKind: DsaKindId): boolean {
    return kindFilterMatches(selectedKind, topicKind);
  }

  function pathFilterMatches(filter: PathFilter, topic: DsaTopicCardData): boolean {
    return filter === 'all' || topic.pathIds.includes(filter);
  }

  function pathMatches(topic: DsaTopicCardData): boolean {
    return pathFilterMatches(activePathId, topic);
  }

  function tagMatches(topic: DsaTopicCardData): boolean {
    return selectedTags.length === 0 || selectedTags.every(tag => topic.tags.includes(tag));
  }

  function queryMatches(topic: DsaTopicCardData): boolean {
    return queryTokens.length === 0 || queryTokens.every(token => topic.searchText.includes(token));
  }

  function matchesCurrentFilters(topic: DsaTopicCardData): boolean {
    return (
      queryMatches(topic) &&
      familyMatches(topic.family) &&
      kindMatches(topic.kind) &&
      pathMatches(topic) &&
      tagMatches(topic)
    );
  }

  function countMatchingTopics(
    {
      family = selectedFamily,
      kind = selectedKind,
      path = activePathId,
    }: {
      family?: FamilyFilter;
      kind?: KindFilter;
      path?: PathFilter;
    } = {},
  ): number {
    return topics.filter(topic => (
      queryMatches(topic) &&
      familyFilterMatches(family, topic.family) &&
      kindFilterMatches(kind, topic.kind) &&
      pathFilterMatches(path, topic) &&
      tagMatches(topic)
    )).length;
  }

  function sortTopics(topicsToSort: DsaTopicCardData[]): DsaTopicCardData[] {
    if (!activePath) {
      return topicsToSort;
    }

    const stepOrder = new Map(activePath.steps.map((step, index) => [step.slug, index]));

    return [...topicsToSort].sort((a, b) => {
      const aOrder = stepOrder.get(a.slug);
      const bOrder = stepOrder.get(b.slug);

      if (aOrder !== undefined || bOrder !== undefined) {
        return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
      }

      return a.title.localeCompare(b.title);
    });
  }

  function buildGroups(items: DsaTopicCardData[]): ResultGroup[] {
    const orderedItems = sortTopics(items);

    if (groupMode === 'kind') {
      return dsaKindValues
        .map(kind => ({
          id: kind,
          label: dsaKindMeta[kind].label,
          description: kindGroupDescriptions[kind],
          visibleTopics: orderedItems.filter(topic => topic.kind === kind),
        }))
        .filter(group => group.visibleTopics.length > 0);
    }

    if (groupMode === 'difficulty') {
      return dsaDifficultyValues
        .map(level => ({
          id: level,
          label: dsaDifficultyMeta[level].label,
          description: difficultyGroupDescriptions[level],
          visibleTopics: orderedItems.filter(topic => topic.difficulty === level),
        }))
        .filter(group => group.visibleTopics.length > 0);
    }

    if (groupMode === 'flat') {
      return [{
        id: 'all-results',
        label: activePath ? `${activePath.title} matches` : 'All matching topics',
        description: activePath
          ? 'Results stay in learning-path order while the current search and filters narrow the list.'
          : 'A flat view works well when search or tags are already doing most of the narrowing.',
        visibleTopics: orderedItems,
      }];
    }

    return families
      .map(family => ({
        id: family.id,
        label: family.label,
        description: family.description,
        note: family.note,
        visibleTopics: orderedItems.filter(topic => topic.family === family.id),
      }))
      .filter(group => group.visibleTopics.length > 0);
  }

  function isValidFamilyFilter(value: string | null): value is DsaFamilyId {
    return Boolean(value) && Object.prototype.hasOwnProperty.call(dsaFamilies, value);
  }

  function isValidKindFilter(value: string | null): value is DsaKindId {
    return Boolean(value) && dsaKindValues.includes(value as DsaKindId);
  }

  function isValidPathFilter(value: string | null): value is string {
    return Boolean(value) && paths.some(path => path.id === value);
  }

  function isValidGroupMode(value: string | null): value is GroupMode {
    return value === 'family' || value === 'kind' || value === 'difficulty' || value === 'flat';
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

    const path = params.get('path');
    if (isValidPathFilter(path)) {
      activePathId = path;
    }

    const tags = params.getAll('tag').filter(tag => allTags.includes(tag));
    if (tags.length > 0) {
      selectedTags = [...new Set(tags)].sort();
    }

    const nextGroupMode = params.get('group');
    if (isValidGroupMode(nextGroupMode)) {
      groupMode = nextGroupMode;
    }

    hasMounted = true;
  });

  $: normalizedQuery = query.trim().toLowerCase();
  $: queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  $: activePath = activePathId === 'all'
    ? undefined
    : paths.find(path => path.id === activePathId);
  $: filteredTopics = topics.filter(matchesCurrentFilters);
  $: resultGroups = buildGroups(filteredTopics);
  $: resultCount = filteredTopics.length;
  $: hasActiveFilters = (
    normalizedQuery.length > 0 ||
    selectedFamily !== 'all' ||
    selectedKind !== 'all' ||
    activePathId !== 'all' ||
    selectedTags.length > 0
  );
  $: familyCounts = Object.fromEntries([
    ['all', countMatchingTopics({ family: 'all' })],
    ...families.map(family => [family.id, countMatchingTopics({ family: family.id })]),
  ]) as Record<string, number>;
  $: kindCounts = Object.fromEntries([
    ['all', countMatchingTopics({ kind: 'all' })],
    ...dsaKindValues.map(kind => [kind, countMatchingTopics({ kind })]),
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
    if (activePathId !== 'all') {
      params.set('path', activePathId);
    }
    if (groupMode !== 'family') {
      params.set('group', groupMode);
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
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Topics</p>
      <p class="text-3xl font-semibold">{stats.totalTopics}</p>
      <p class="mt-2 text-sm text-muted-foreground">Every topic is linked by family, prerequisites, and what it unlocks.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Families</p>
      <p class="text-3xl font-semibold">{stats.totalFamilies}</p>
      <p class="mt-2 text-sm text-muted-foreground">Trees sit under graphs, so conceptual navigation mirrors the underlying theory.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Algorithms</p>
      <p class="text-3xl font-semibold">{stats.totalAlgorithms}</p>
      <p class="mt-2 text-sm text-muted-foreground">Traverse, search, sort, and optimize with clear follow-up suggestions.</p>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <p class="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Learning paths</p>
      <p class="text-3xl font-semibold">{stats.totalPaths}</p>
      <p class="mt-2 text-sm text-muted-foreground">Curated routes help you move from fundamentals to more specialized topics.</p>
    </div>
  </section>

  <section class="space-y-6 rounded-2xl border border-border bg-card p-6">
    <div class="space-y-3">
      <div>
        <h2 class="text-2xl font-semibold">Navigate the DSA atlas</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Search, filter, and regroup the atlas without losing context. The current search and filters stay in the URL,
          so it is easier to revisit the same slice after opening a topic.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="block flex-1">
          <span class="sr-only">Search DSA topics</span>
          <input
            bind:value={query}
            type="search"
            placeholder="Search topics, paths, tags, dependencies, or what a concept unlocks..."
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
              Family: {dsaFamilies[selectedFamily].label}
            </Badge>
          {/if}
          {#if selectedKind !== 'all'}
            <Badge variant="secondary" class="text-[11px]">
              Type: {dsaKindMeta[selectedKind].label}
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

    <div class="space-y-4">
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
            <p class="mt-2 text-sm text-muted-foreground">See the full map across structures, algorithms, and strategies.</p>
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
          {#each dsaKindValues as kind}
            <button
              type="button"
              aria-pressed={selectedKind === kind}
              class={`rounded-full border px-3 py-2 text-sm transition-colors ${selectedKind === kind ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { setKindFilter(kind); }}
            >
              {dsaKindMeta[kind].label}
              <span class="ml-2 text-xs opacity-80">{kindCounts[kind] ?? 0}</span>
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
        <h2 class="text-2xl font-semibold">Curated learning paths</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Focus on a path to shrink the grid to a coherent sequence instead of a flat list.
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
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{path.title}</h3>
                <Badge variant="secondary" class="text-[11px]">
                  {pathCounts[path.id] ?? 0} matching
                </Badge>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">{path.description}</p>
            </div>
            <button
              type="button"
              aria-pressed={activePathId === path.id}
              class={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${activePathId === path.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { setPathFocus(path.id); }}
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
    <div class="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-2xl font-semibold">Topic map</h2>
          <p class="mt-2 text-sm text-muted-foreground">
            {resultCount} {resultCount === 1 ? 'topic' : 'topics'} match the current search and filters,
            grouped by {groupModeMeta[groupMode].label.toLowerCase()}.
          </p>
        </div>

        <button
          type="button"
          class={`self-start rounded-full border px-3 py-2 text-sm transition-colors ${hasActiveFilters ? 'border-border hover:border-primary/40' : 'cursor-not-allowed border-border/60 text-muted-foreground/70'}`}
          disabled={!hasActiveFilters}
          on:click={resetFilters}
        >
          Clear search & filters
        </button>
      </div>

      <div>
        <p class="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Group matching topics</p>
        <div class="flex flex-wrap gap-2">
          {#each groupModes as mode}
            <button
              type="button"
              aria-pressed={groupMode === mode}
              class={`rounded-full border px-3 py-2 text-sm transition-colors ${groupMode === mode ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
              on:click={() => { groupMode = mode; }}
            >
              {groupModeMeta[mode].label}
            </button>
          {/each}
        </div>
        <p class="mt-3 text-sm text-muted-foreground">{groupModeMeta[groupMode].description}</p>
      </div>
    </div>

    {#if resultGroups.length === 0}
      <div class="space-y-3 rounded-2xl border border-dashed border-border p-10 text-center">
        <h3 class="text-lg font-semibold">No topics match the current filters</h3>
        <p class="text-sm text-muted-foreground">
          Try clearing a filter, removing a tag, or using a broader search phrase.
        </p>
      </div>
    {:else}
      <div class="space-y-10">
        {#each resultGroups as group}
          <section class="space-y-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-xl font-semibold">{group.label}</h3>
                  {#if group.note}
                    <Badge variant="secondary" class="text-[11px]">
                      {group.note}
                    </Badge>
                  {/if}
                </div>
                <p class="mt-2 text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <p class="text-sm text-muted-foreground">
                {group.visibleTopics.length} {group.visibleTopics.length === 1 ? 'topic' : 'topics'}
              </p>
            </div>

            <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {#each group.visibleTopics as topic (topic.slug)}
                <DsaCard {topic} />
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </section>
</div>
