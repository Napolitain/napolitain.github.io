<script lang="ts">
  import Badge from '@/components/ui/badge.svelte';

  export let tags: string[] = [];
  export let selectedTags: string[] = [];
  export let onToggle: (tag: string) => void = () => {};
</script>

<div class="space-y-4">
  <!-- Tag filters -->
  <div class="flex flex-wrap items-center gap-2">
    {#each tags as tag}
      <button
        type="button"
        class="cursor-pointer"
        aria-pressed={selectedTags.includes(tag)}
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
