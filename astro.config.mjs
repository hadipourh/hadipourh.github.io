// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import partytown from "@astrojs/partytown";

import { template } from "./src/settings";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    integrations: [
        react(), 
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
        shikiConfig: {
            // Disable default themes and use CSS variables instead
            // This allows our theme-based CSS to control code block colors
            theme: 'css-variables',
            wrap: false,
        }
    }
});
