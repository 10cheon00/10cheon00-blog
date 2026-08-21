import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    description: z
      .string()
      .nullish()
      .transform((value) => value ?? undefined),
    tags: z.array(z.string()).default([]),
    category: z
      .union([
        z.string(),
        z.object({
          name: z.string()
        })
      ])
      .optional(),
    series: z
      .object({
        name: z.string(),
        order: z.number().int().nonnegative()
      })
      .optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { blog };
