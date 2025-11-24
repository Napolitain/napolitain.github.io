<script lang="ts">
  import { Calendar, Tag, ArrowUpRight, Clock } from 'phosphor-svelte';
  import Card from '@/components/ui/card.svelte';
  import Badge from '@/components/ui/badge.svelte';

  export let title: string;
  export let description: string;
  export let date: Date;
  export let tags: string[] = [];
  export let slug: string;
  export let readingTime: string = '';

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
</script>

<a href={`/blog/${slug}`} class="block">
  <Card class="p-10 h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <h3 class="text-xl font-semibold group-hover:text-primary transition-colors flex-1">
          {title}
        </h3>
        <ArrowUpRight size={24} class="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0 ml-4" />
      </div>

      <p class="text-muted-foreground leading-relaxed line-clamp-3">
        {description}
      </p>

      <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-2">
          <Calendar size={16} />
          <time datetime={date.toISOString()}>
            {formatDate(date)}
          </time>
        </div>
        
        {#if readingTime}
          <div class="flex items-center gap-2">
            <Clock size={16} />
            <span>{readingTime}</span>
          </div>
        {/if}
      </div>

      {#if tags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each tags as tag}
            <Badge variant="secondary" class="text-xs">
              <Tag size={12} class="mr-1" />
              {tag}
            </Badge>
          {/each}
        </div>
      {/if}
    </div>
  </Card>
</a>
