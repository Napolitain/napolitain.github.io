# Blog Guide

This guide explains how to add and manage blog posts on the portfolio website.

## Quick Start

### Adding a New Blog Post

1. **Create a new markdown file** in `src/content/blog/`:
   ```bash
   # File name should be URL-friendly (lowercase, hyphens for spaces)
   touch src/content/blog/my-new-post.md
   ```

2. **Add frontmatter** at the top of the file:
   ```markdown
   ---
   title: "Your Post Title"
   description: "A brief description of your post (used in previews)"
   date: 2025-01-20
   tags: ["tag1", "tag2", "tag3"]
   draft: false
   ---
   ```

3. **Write your content** in markdown below the frontmatter:
   ```markdown
   # Main Heading

   Your content here...

   ## Subheading

   More content...
   ```

4. **Build the site** to generate the static pages:
   ```bash
   npm run build
   ```

## Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `title` | Yes | String | The title of your blog post |
| `description` | Yes | String | A short description (used in blog cards and SEO) |
| `date` | Yes | Date | Publication date in YYYY-MM-DD format |
| `tags` | No | Array | Array of tag strings for categorization |
| `author` | No | String | Author name (defaults to "Napolitain") |
| `draft` | No | Boolean | If true, post won't appear in production |

## Example Blog Post

```markdown
---
title: "Getting Started with TypeScript"
description: "A beginner's guide to TypeScript and its benefits"
date: 2025-01-15
tags: ["typescript", "javascript", "tutorial"]
draft: false
---

# Getting Started with TypeScript

TypeScript is a powerful superset of JavaScript that adds static typing...

## Why TypeScript?

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Enhanced autocomplete and refactoring
3. **Maintainability**: Self-documenting code

## Installation

```bash
npm install -g typescript
```

## Your First TypeScript File

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Conclusion

TypeScript enhances JavaScript development with type safety and better tooling.
```

## Markdown Features

The blog supports standard markdown features:

- **Headings**: `#` through `######`
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Code blocks**: Triple backticks with optional language
- **Lists**: Numbered and bulleted
- **Blockquotes**: `> quote`

## File Structure

```
src/
├── content/
│   ├── blog/              # Your blog posts go here
│   │   ├── post-1.md
│   │   ├── post-2.md
│   │   └── ...
│   └── config.ts          # Content collection schema
├── pages/
│   └── blog/
│       ├── index.astro    # Blog listing page
│       └── [slug].astro   # Individual post template
└── components/
    └── BlogCard.svelte    # Blog card component
```

## Tips

1. **Use descriptive file names**: They become the URL slug
   - `my-awesome-post.md` → `/blog/my-awesome-post`

2. **Keep descriptions short**: Aim for 1-2 sentences (displayed in blog cards)

3. **Use tags wisely**: They help readers find related content
   - Keep them lowercase and hyphenated: `web-development`, `tutorial`

4. **Draft mode**: Set `draft: true` to work on posts without publishing

5. **Date format**: Always use YYYY-MM-DD format for consistency

## Building and Deploying

To see your changes locally:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

The static files will be generated in the `dist/` directory.

## URLs

- Blog listing: `/blog`
- Individual post: `/blog/[filename-without-md]`

Example:
- File: `src/content/blog/hello-world.md`
- URL: `/blog/hello-world`
