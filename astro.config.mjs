// @ts-check
import { defineConfig } from "astro/config";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import tailwind from "@astrojs/tailwind";
import partytown from "@astrojs/partytown";

import { template } from "./src/settings";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    integrations: [
        tailwind(), 
        sitemap(),
        partytown({
            config: {
                forward: ["gtag"],
            },
        })
    ],
    site: 'https://hadipourh.github.io',
    base: '/',
    vite: {
        optimizeDeps: {
            // `age-encryption` is only reached through a dynamic import inside
            // the terminal (`/encrypt`), so Vite's dependency scanner never
            // finds it at dev-server startup and the import fails at runtime
            // with "Importing a module script failed". Pre-bundle it eagerly.
            // Production builds are unaffected — Rollup bundles it statically.
            include: ['age-encryption'],
        },
    },
    markdown: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
        shikiConfig: {
            // Disable default themes and use CSS variables instead
            // This allows our theme-based CSS to control code block colors
            theme: 'css-variables',
            wrap: false,
        }
    }
});
