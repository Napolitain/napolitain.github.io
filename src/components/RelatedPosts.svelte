<script lang="ts">
    import BlogCard from "./BlogCard.svelte";

    interface Post {
        title: string;
        description: string;
        date: Date;
        tags: string[];
        slug: string;
        readingTime: string;
    }

    export let posts: Post[];
    export let title: string = "Related Posts";
    export let description: string = "";
</script>

{#if posts.length > 0}
    <section class="py-20 border-t border-border mt-20">
        <div class="mb-10 space-y-3">
            <h2 class="text-3xl font-bold">{title}</h2>
            {#if description}
                <p class="text-muted-foreground max-w-3xl">{description}</p>
            {/if}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {#each posts as post}
                <BlogCard
                    title={post.title}
                    description={post.description}
                    date={post.date}
                    tags={post.tags}
                    slug={post.slug}
                    readingTime={post.readingTime}
                />
            {/each}
        </div>
    </section>
{/if}
