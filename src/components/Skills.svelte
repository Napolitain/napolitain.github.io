<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { Code, Desktop, Database, GitBranch, Wrench } from 'phosphor-svelte';
  import Badge from '@/components/ui/badge.svelte';
  import Card from '@/components/ui/card.svelte';
  import Skeleton from '@/components/ui/skeleton.svelte';

  const USERNAME = 'Napolitain';
  const ORG_NAME = 'fds-napolitain';

  interface SkillCategory {
    icon: any;
    title: string;
    skills: string[];
  }

  // Accept githubData as a prop from Astro
  export let githubData: any = null;

  let skillCategories: SkillCategory[] = [];
  let loading = true;

  const iconMap: Record<string, any> = {
    Code,
    Desktop,
    Database,
    Wrench,
    GitBranch
  };

  onMount(async () => {
    try {
      let categorized;
      if (githubData && githubData.skills) {
        categorized = githubData.skills.categorized;
      } else {
        // Fallback to JSON file
        const data = await import('@/data/github-data.json');
        categorized = data.skills.categorized;
      }
      
      const categories: SkillCategory[] = [];
      
      if (categorized.languages.length > 0) {
        categories.push({
          icon: Code,
          title: 'Languages',
          skills: categorized.languages
        });
      }
      
      if (categorized.frontend.length > 0) {
        categories.push({
          icon: Desktop,
          title: 'Frontend',
          skills: categorized.frontend
        });
      }
      
      if (categorized.backend.length > 0) {
        categories.push({
          icon: Database,
          title: 'Backend & Databases',
          skills: categorized.backend
        });
      }
      
      if (categorized.tools.length > 0) {
        categories.push({
          icon: Wrench,
          title: 'Tools & DevOps',
          skills: categorized.tools
        });
      }
      
      if (categorized.other.length > 0) {
        categories.push({
          icon: GitBranch,
          title: 'Other Technologies',
          skills: categorized.other
        });
      }
      
      skillCategories = categories;
      loading = false;
    } catch (error) {
      console.error('Failed to load skills:', error);
      skillCategories = [
        {
          icon: Code,
          title: 'Languages',
          skills: ['TypeScript', 'JavaScript', 'Python', 'Java']
        },
        {
          icon: Desktop,
          title: 'Frontend',
          skills: ['React', 'Next.js', 'Tailwind CSS']
        },
        {
          icon: Database,
          title: 'Backend & Databases',
          skills: ['Node.js', 'PostgreSQL', 'MongoDB']
        },
        {
          icon: GitBranch,
          title: 'Tools & DevOps',
          skills: ['Git', 'Docker', 'CI/CD']
        }
      ];
      loading = false;
    }
  });
</script>

<section class="py-24 px-6 bg-secondary/30">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl font-bold mb-4">Skills & Technologies</h2>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        Technologies from my repositories ({USERNAME} and {ORG_NAME}) and CV
      </p>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each [1, 2, 3, 4] as i}
          <Card class="p-8 space-y-4">
            <Skeleton class="h-8 w-48" />
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-8 w-20" />
              <Skeleton class="h-8 w-24" />
              <Skeleton class="h-8 w-20" />
              <Skeleton class="h-8 w-28" />
              <Skeleton class="h-8 w-22" />
            </div>
          </Card>
        {/each}
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each skillCategories as category, index}
          <div 
            in:fly={{ y: 20, duration: 500, delay: index * 100 }}
            class="bg-card rounded-lg p-8 shadow-sm"
          >
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2 rounded-lg bg-primary/10">
                <svelte:component this={category.icon} size={24} class="text-primary" />
              </div>
              <h3 class="text-xl font-semibold">{category.title}</h3>
            </div>
            <div class="flex flex-wrap gap-3">
              {#each category.skills as skill}
                <Badge 
                  variant="secondary"
                  class="text-sm py-1.5 px-3 hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                >
                  {skill}
                </Badge>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
