<script lang="ts">
  import DsaCard from './DsaCard.svelte';
  import TagFilter from './TagFilter.svelte';

  interface Problem {
    title: string;
    description: string;
    tags: string[];
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }

  export let problems: Problem[] = [];

  // Collect all unique tags sorted alphabetically
  $: allTags = [...new Set(problems.flatMap(p => p.tags))].sort();

  let selectedTags: string[] = [];
  let selectedDifficulties: string[] = [];

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  function toggleDifficulty(d: string) {
    if (selectedDifficulties.includes(d)) {
      selectedDifficulties = selectedDifficulties.filter(x => x !== d);
    } else {
      selectedDifficulties = [...selectedDifficulties, d];
    }
  }

  // AND logic: problem must have ALL selected tags
  $: filtered = problems.filter(p => {
    const matchesTags = selectedTags.length === 0 || selectedTags.every(t => p.tags.includes(t));
    const matchesDiff = selectedDifficulties.length === 0 || selectedDifficulties.includes(p.difficulty);
    return matchesTags && matchesDiff;
  });

  $: count = filtered.length;
</script>

<div class="space-y-8">
  <TagFilter
    tags={allTags}
    {selectedTags}
    onToggle={toggleTag}
    {selectedDifficulties}
    onToggleDifficulty={toggleDifficulty}
  />

  <p class="text-sm text-muted-foreground">
    {count} {count === 1 ? 'problem' : 'problems'}
    {#if selectedTags.length > 0 || selectedDifficulties.length > 0}
      <button
        class="ml-2 text-primary hover:underline cursor-pointer"
        on:click={() => { selectedTags = []; selectedDifficulties = []; }}
      >
        Clear filters
      </button>
    {/if}
  </p>

  {#if filtered.length === 0}
    <div class="text-center py-16">
      <p class="text-muted-foreground">No problems match the selected filters.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filtered as problem (problem.slug)}
        <DsaCard
          title={problem.title}
          description={problem.description}
          tags={problem.tags}
          slug={problem.slug}
          difficulty={problem.difficulty}
        />
      {/each}
    </div>
  {/if}
</div>
