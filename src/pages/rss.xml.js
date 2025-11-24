import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const blog = await getCollection('blog', ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });

    return rss({
        title: 'Napolitain - Blog',
        description: 'Thoughts and writings about software engineering and technology',
        site: 'https://napolitain.github.io',
        items: blog.map((post) => ({
            title: post.data.title,
            pubDate: post.data.date,
            description: post.data.description,
            link: `/blog/${post.slug}/`,
        })),
        customData: `<language>en-us</language>`,
    });
}
