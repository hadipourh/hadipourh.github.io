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
