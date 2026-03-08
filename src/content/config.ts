import { defineCollection, z } from 'astro:content';

import {
  dsaDifficultyValues,
  dsaFamilyValues,
  dsaKindValues,
} from '../lib/dsa-meta';
import {
  graphicsDifficultyValues,
  graphicsFamilyValues,
  graphicsKindValues,
} from '../lib/graphics-meta';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Napolitain'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
  }),
});

const dsa = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    visualization: z.string().optional(),
    family: z.enum(dsaFamilyValues),
    kind: z.enum(dsaKindValues),
    difficulty: z.enum(dsaDifficultyValues),
    prerequisites: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    enables: z.array(z.string()).default([]),
  }),
});

const graphics = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    visualization: z.string().optional(),
    family: z.enum(graphicsFamilyValues),
    kind: z.enum(graphicsKindValues),
    difficulty: z.enum(graphicsDifficultyValues),
    prerequisites: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    enables: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, dsa, graphics };
