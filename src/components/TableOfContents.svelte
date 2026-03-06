<script lang="ts">
  interface TocItem {
    depth: number;
    text: string;
    slug: string;
  }

  let { selector = '.prose' }: { selector?: string } = $props();
  let headings = $state<TocItem[]>([]);
  let activeSlug = $state('');

  function slugify(text: string): string {
    return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  }

  $effect(() => {
    const container = document.querySelector(selector);
    if (!container) return;

    const elements = container.querySelectorAll('h2, h3');
    const items: TocItem[] = [];

    elements.forEach((el) => {
      const text = el.textContent?.trim() || '';
      const slug = el.id || slugify(text);
      if (!el.id) el.id = slug;
      items.push({
        depth: parseInt(el.tagName[1]),
        text,
        slug,
      });
    });

    headings = items;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeSlug = entry.target.id;
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
</script>

{#if headings.length > 2}
  <nav class="toc hidden xl:block fixed top-32 right-8 w-56 max-h-[calc(100vh-12rem)] overflow-y-auto" aria-label="Table of contents">
    <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
    <ul class="space-y-1 text-sm border-l border-border">
      {#each headings as heading}
        <li>
          <a
            href="#{heading.slug}"
            class="block py-1 transition-colors hover:text-foreground border-l-2 -ml-px"
            class:pl-4={heading.depth === 2}
            class:pl-7={heading.depth === 3}
            class:border-primary={activeSlug === heading.slug}
            class:text-foreground={activeSlug === heading.slug}
            class:font-medium={activeSlug === heading.slug}
            class:border-transparent={activeSlug !== heading.slug}
            class:text-muted-foreground={activeSlug !== heading.slug}
          >
            {heading.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
