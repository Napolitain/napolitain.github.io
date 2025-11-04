<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { Star, GitFork, ArrowUpRight } from 'phosphor-svelte';
  import Card from '@/components/ui/card.svelte';
  import Badge from '@/components/ui/badge.svelte';
  import Skeleton from '@/components/ui/skeleton.svelte';
  import Button from '@/components/ui/button.svelte';
  import githubData from '@/data/github-data.json';

  interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    topics: string[];
    fork: boolean;
    owner: {
      login: string;
    };
  }

  const USERNAME = 'Napolitain';
  const ORG_NAME = 'fds-napolitain';
  const INITIAL_DISPLAY = 9;

  let repos: Repository[] = [];
  let displayedRepos: Repository[] = [];
  let loading = true;
  let error = false;
  let showAll = false;

  onMount(async () => {
    try {
      const allRepos = githubData.allRepos as Repository[];
      const nonForkRepos = allRepos.filter(repo => !repo.fork);
      
      repos = nonForkRepos;
      displayedRepos = nonForkRepos.slice(0, INITIAL_DISPLAY);
      loading = false;
    } catch (err) {
      console.error('Failed to load repos:', err);
      error = true;
      loading = false;
    }
  });

  function handleShowMore() {
    if (showAll) {
      displayedRepos = repos.slice(0, INITIAL_DISPLAY);
      showAll = false;
    } else {
      displayedRepos = repos;
      showAll = true;
    }
  }
</script>

{#if loading}
  <section class="py-20 px-4 md:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-12">
        <Skeleton class="h-12 w-64 mx-auto mb-4" />
        <Skeleton class="h-6 w-96 mx-auto" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {#each [1, 2, 3, 4, 5, 6] as i}
          <Card class="p-6 space-y-4">
            <Skeleton class="h-6 w-3/4" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
            <div class="flex gap-2">
              <Skeleton class="h-6 w-16" />
              <Skeleton class="h-6 w-16" />
            </div>
          </Card>
        {/each}
      </div>
    </div>
  </section>
{:else if !error && repos.length > 0}
  <section class="py-20 px-4 md:px-6 lg:px-8 bg-secondary/30">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Other Projects</h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Additional work from my personal account and {ORG_NAME} organization
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {#each displayedRepos as repo, index (repo.id)}
          <div in:fly={{ y: 20, duration: 500, delay: index * 50 }}>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              <Card class="p-6 h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs text-muted-foreground">
                        {repo.owner.login}
                      </span>
                    </div>
                    <h3 class="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                      {repo.name}
                    </h3>
                  </div>
                  <ArrowUpRight size={20} class="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0 ml-2" />
                </div>
                
                <p class="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {repo.description || 'No description available'}
                </p>

                <div class="flex flex-wrap gap-3 mb-4">
                  {#if repo.language}
                    <Badge variant="secondary" class="text-xs">
                      {repo.language}
                    </Badge>
                  {/if}
                  {#each repo.topics?.slice(0, 2) || [] as topic}
                    <Badge variant="outline" class="text-xs">
                      {topic}
                    </Badge>
                  {/each}
                </div>

                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <Star size={16} weight="fill" class="text-yellow-500" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <GitFork size={16} />
                    <span>{repo.forks_count}</span>
                  </div>
                </div>
              </Card>
            </a>
          </div>
        {/each}
      </div>

      {#if repos.length > INITIAL_DISPLAY}
        <div class="text-center mt-12" in:fade={{ duration: 300 }}>
          <Button
            on:click={handleShowMore}
            variant="outline"
            size="lg"
          >
            {showAll ? 'Show Less' : `Show More (${repos.length - INITIAL_DISPLAY} more)`}
          </Button>
        </div>
      {/if}
    </div>
  </section>
{/if}
