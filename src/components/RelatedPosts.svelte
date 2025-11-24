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
</script>

{#if posts.length > 0}
    <section class="py-20 border-t border-border mt-20">
        <h2 class="text-3xl font-bold mb-10">Related Posts</h2>
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
