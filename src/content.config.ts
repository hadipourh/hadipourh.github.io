// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

// 3. Define your collection(s)
const blog = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/blog",
    }),
    schema: z.object({
        title: z.string(),
        date: z.date(),
        excerpt: z.string(),
        tags: z.array(z.string()),
        draft: z.boolean().default(false),
    }),
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { blog };
