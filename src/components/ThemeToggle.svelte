<script lang="ts">
  import { onMount } from 'svelte';
  import { Moon, Sun } from 'phosphor-svelte';
  
  let theme: 'light' | 'dark' = 'light';
  let mounted = false;
  
  onMount(() => {
    mounted = true;
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      theme = 'dark';
      document.documentElement.classList.add('dark');
    } else {
      theme = 'light';
      document.documentElement.classList.remove('dark');
    }
  });
  
  function toggleTheme() {
    if (theme === 'light') {
      theme = 'dark';
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      theme = 'light';
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
</script>

{#if mounted}
  <button
    on:click={toggleTheme}
    aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    class="fixed top-4 right-4 z-50 p-3 rounded-full bg-card hover:bg-secondary transition-colors shadow-md border border-border"
  >
    {#if theme === 'light'}
      <Moon size={20} weight="fill" class="text-foreground" />
    {:else}
      <Sun size={20} weight="fill" class="text-foreground" />
    {/if}
  </button>
{/if}
