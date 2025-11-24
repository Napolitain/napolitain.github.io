import type { CollectionEntry } from 'astro:content';

/**
 * Calculate estimated reading time for a blog post
 * Assumes average reading speed of 200 words per minute
 */
export function getReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

/**
 * Find related posts based on shared tags
 * Returns top N posts with most matching tags
 */
export function getRelatedPosts(
    currentPost: CollectionEntry<'blog'>,
    allPosts: CollectionEntry<'blog'>[],
    limit: number = 3
): CollectionEntry<'blog'>[] {
    const currentTags = new Set(currentPost.data.tags);

    // Don't include the current post
    const candidates = allPosts.filter(post => post.slug !== currentPost.slug);

    const postsWithScore = candidates.map(post => {
        let score = 0;
        post.data.tags.forEach(tag => {
            if (currentTags.has(tag)) {
                score += 1;
            }
        });
        return { post, score };
    });

    // Sort by score (descending) then by date (newest first)
    postsWithScore.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.post.data.date.valueOf() - a.post.data.date.valueOf();
    });

    // Return only posts that have at least one matching tag
    return postsWithScore
        .filter(item => item.score > 0)
        .slice(0, limit)
        .map(item => item.post);
}
