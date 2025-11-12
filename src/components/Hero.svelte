<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { GithubLogo, LinkedinLogo, ArrowRight, Article } from 'phosphor-svelte';
</script>

<section class="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
  <div class="absolute inset-0 -z-10" aria-hidden="true">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
  </div>
  
  <div class="max-w-4xl w-full text-center space-y-12">
    <div in:fly={{ y: 20, duration: 600 }}>
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
        Napolitain
      </h1>
      <p class="text-2xl md:text-3xl text-muted-foreground font-medium mb-8">
        Software Engineer
      </p>
      <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Building elegant solutions to complex problems. 
        Passionate about clean code, modern web technologies, and open source.
      </p>
    </div>

    <div in:fly={{ y: 20, duration: 600, delay: 200 }} class="flex flex-wrap items-center justify-center gap-6">
      <a
        href="#projects"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-10 px-6 bg-accent hover:bg-accent/90 text-accent-foreground group shadow-xs"
      >
        View Projects
        <ArrowRight class="ml-2 group-hover:translate-x-1 transition-transform" />
      </a>
      <a
        href="/blog"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-10 px-6 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
      >
        <Article size={20} />
        Blog
      </a>
      <a
        href="#contact"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-10 px-6 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
      >
        Get in Touch
      </a>
    </div>

    <div in:fade={{ duration: 600, delay: 400 }} class="flex items-center justify-center gap-6 pt-12">
      <a 
        href="https://github.com/Napolitain" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Visit my GitHub profile"
        class="p-3 rounded-full bg-card hover:bg-secondary transition-colors shadow-sm"
      >
        <GithubLogo size={24} class="text-foreground" />
      </a>
      <a 
        href="https://linkedin.com/in/mxboucher" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Visit my LinkedIn profile"
        class="p-3 rounded-full bg-card hover:bg-secondary transition-colors shadow-sm"
      >
        <LinkedinLogo size={24} class="text-foreground" />
      </a>
    </div>
  </div>
</section>
