<script lang="ts">
  import { cn } from '@/lib/utils';
  import Card from '@/components/ui/card.svelte';
  import Badge from '@/components/ui/badge.svelte';
  import { ArrowUpRight, Tag } from 'phosphor-svelte';

  export let title: string;
  export let description: string;
  export let tags: string[] = [];
  export let slug: string;
  export let difficulty: 'easy' | 'medium' | 'hard';

  const difficultyColors: Record<string, string> = {
    easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
</script>

<a href={`/dsa/${slug}`} class="block">
  <Card class="p-8 h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-semibold group-hover:text-primary transition-colors flex-1">
          {title}
        </h3>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', difficultyColors[difficulty])}>
            {difficulty}
          </span>
          <ArrowUpRight size={20} class="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {description}
      </p>

      {#if tags.length > 0}
        <div class="flex flex-wrap gap-1.5 pt-1">
          {#each tags as tag}
            <Badge variant="secondary" class="text-xs">
              {tag}
            </Badge>
          {/each}
        </div>
      {/if}
    </div>
  </Card>
</a>
