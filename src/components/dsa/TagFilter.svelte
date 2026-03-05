<script lang="ts">
  import Badge from '@/components/ui/badge.svelte';
  import { cn } from '@/lib/utils';

  export let tags: string[] = [];
  export let selectedTags: string[] = [];
  export let onToggle: (tag: string) => void = () => {};

  // Difficulty filters
  const difficulties = ['easy', 'medium', 'hard'] as const;
  export let selectedDifficulties: string[] = [];
  export let onToggleDifficulty: (d: string) => void = () => {};

  const difficultyColors: Record<string, { active: string; inactive: string }> = {
    easy: {
      active: 'bg-emerald-600 text-white dark:bg-emerald-500',
      inactive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    },
    medium: {
      active: 'bg-amber-600 text-white dark:bg-amber-500',
      inactive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    },
    hard: {
      active: 'bg-red-600 text-white dark:bg-red-500',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
    },
  };
</script>

<div class="space-y-4">
  <!-- Difficulty filters -->
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-sm font-medium text-muted-foreground mr-1">Difficulty:</span>
    {#each difficulties as d}
      <button
        class={cn(
          'text-xs font-medium px-3 py-1 rounded-full capitalize transition-colors cursor-pointer',
          selectedDifficulties.includes(d) ? difficultyColors[d].active : difficultyColors[d].inactive
        )}
        on:click={() => onToggleDifficulty(d)}
      >
        {d}
      </button>
    {/each}
  </div>

  <!-- Tag filters -->
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-sm font-medium text-muted-foreground mr-1">Tags:</span>
    {#each tags as tag}
      <button
        class="cursor-pointer"
        on:click={() => onToggle(tag)}
      >
        <Badge
          variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
          class="text-xs transition-colors hover:opacity-80"
        >
          {tag}
        </Badge>
      </button>
    {/each}
  </div>
</div>
