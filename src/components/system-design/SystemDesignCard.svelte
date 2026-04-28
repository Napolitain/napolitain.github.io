<script lang="ts">
  import { ArrowUpRight } from 'phosphor-svelte';

  import Badge from '@/components/ui/badge.svelte';
  import Card from '@/components/ui/card.svelte';
  import type { SystemDesignTopicCardData, SystemDesignTopicLink } from '@/lib/system-design';

  export let topic: SystemDesignTopicCardData;

  function preview(items: SystemDesignTopicLink[], limit = 3): SystemDesignTopicLink[] {
    return items.slice(0, limit);
  }
</script>

<a href={`/system-design/${topic.slug}`} class="block h-full">
  <Card class="h-full border-border/80 p-6 transition-all duration-300 group cursor-pointer hover:border-primary/30 hover:shadow-lg">
    <div class="space-y-5 h-full">
      <div class="flex items-start justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <Badge variant="outline" class="text-[11px]">
            {topic.familyLabel}
          </Badge>
          <Badge variant="secondary" class="text-[11px]">
            {topic.kindLabel}
          </Badge>
          <Badge variant="secondary" class="text-[11px]">
            {topic.difficultyLabel}
          </Badge>
        </div>
        <ArrowUpRight size={20} class="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
      </div>

      <div class="space-y-3">
        <h3 class="text-lg font-semibold group-hover:text-primary transition-colors">
          {topic.title}
        </h3>

        <p class="text-sm leading-relaxed text-muted-foreground">
          {topic.description}
        </p>

        {#if topic.familyParentLabel}
          <p class="text-xs text-muted-foreground">
            <span class="font-medium text-foreground">{topic.familyLabel}</span>
            lives inside
            <span class="font-medium text-foreground"> {topic.familyParentLabel}</span>
            , so broader distributed-systems trade-offs still matter here.
          </p>
        {/if}
      </div>

      <div class="space-y-3 text-xs text-muted-foreground">
        {#if topic.prerequisiteTopics.length > 0}
          <div class="space-y-1.5">
            <p class="font-medium uppercase tracking-[0.2em] text-[11px] text-foreground/80">
              Builds on
            </p>
            <p>
              {#each preview(topic.prerequisiteTopics) as prerequisite, index}
                <span class="text-foreground">{prerequisite.title}</span>{index < preview(topic.prerequisiteTopics).length - 1 ? ', ' : ''}
              {/each}
              {#if topic.prerequisiteTopics.length > 3}
                <span> +{topic.prerequisiteTopics.length - 3} more</span>
              {/if}
            </p>
          </div>
        {:else}
          <div class="space-y-1.5">
            <p class="font-medium uppercase tracking-[0.2em] text-[11px] text-foreground/80">
              Read now
            </p>
            <p>Self-contained enough to open without another page first.</p>
          </div>
        {/if}

        <div class="space-y-1.5">
          <p class="font-medium uppercase tracking-[0.2em] text-[11px] text-foreground/80">
            Learning paths
          </p>
          <p>{topic.pathIds.length} curated path{topic.pathIds.length === 1 ? '' : 's'} currently include this deep dive.</p>
        </div>

        {#if topic.enabledTopics.length > 0}
          <div class="space-y-1.5">
            <p class="font-medium uppercase tracking-[0.2em] text-[11px] text-foreground/80">
              Unlocks
            </p>
            <p>
              {#each preview(topic.enabledTopics) as enabled, index}
                <span class="text-foreground">{enabled.title}</span>{index < preview(topic.enabledTopics).length - 1 ? ', ' : ''}
              {/each}
              {#if topic.enabledTopics.length > 3}
                <span> +{topic.enabledTopics.length - 3} more</span>
              {/if}
            </p>
          </div>
        {/if}
      </div>

      {#if topic.tags.length > 0}
        <div class="mt-auto flex flex-wrap gap-1.5 pt-1">
          {#each topic.tags as tag}
            <Badge variant="secondary" class="text-[11px]">
              {tag}
            </Badge>
          {/each}
        </div>
      {/if}
    </div>
  </Card>
</a>
