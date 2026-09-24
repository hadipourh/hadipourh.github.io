import daisyuiThemes from "daisyui/src/theming/themes";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    // Bind Tailwind's `dark:` variant to the DaisyUI theme the toggle sets.
    // Without this, `dark:` follows the OS `prefers-color-scheme` instead, so a
    // visitor whose OS and site theme disagree got light-mode colours on a dark
    // background (and vice versa).
    darkMode: ["selector", '[data-theme="night"]'],
    theme: {
        extend: {},
    },
    plugins: [require("@tailwindcss/typography"), require("daisyui")],
    daisyui: {
        // Only the two themes the toggle can reach. Every colour below is the
        // single source of truth — components reference `primary` / `secondary`
        // / `accent` rather than hardcoding a Tailwind hue.
        //
        // Roles (amber CRT palette):
        //   primary   amber  — links, active nav, key figures. "interact / data"
        //   secondary dim    — dates, venues, captions
        //   accent    green  — reserved for the terminal. "live"
        //   warning / error  — reserved, never decorative
        //
        // Contrast against base-100, measured:
        //   body 14.6:1 · amber 10.8:1 · dim 6.4:1 · green 11.3:1  (all >= AA)
        themes: [
            {
                night: {
                    ...daisyuiThemes["night"],
                    primary: "#FFB000",
                    "primary-content": "#0C0A07",
                    secondary: "#A1917A",
                    "secondary-content": "#0C0A07",
                    accent: "#4ADE80",
                    "accent-content": "#0C0A07",
                    neutral: "#1E1810",
                    "base-100": "#0C0A07",
                    "base-200": "#141009",
                    "base-300": "#241C12",
                    "base-content": "#E8DCC8",
                    info: "#7DD3FC",
                    success: "#4ADE80",
                    // yellow, not amber: `warning` must not read as the amber accent
                    warning: "#FDE047",
                    error: "#FB7085",
                },
            },
            {
                corporate: {
                    ...daisyuiThemes["corporate"],
                    // Raw amber is 1.8:1 on white, so the light theme darkens it
                    // to amber-800 (7.1:1) while keeping the same hue.
                    primary: "#92400E",
                    "primary-content": "#FFFFFF",
                    secondary: "#78716C",
                    "secondary-content": "#FFFFFF",
                    accent: "#15803D",
                    "accent-content": "#FFFFFF",
                    "base-content": "#1C1917",
                    warning: "#B45309",
                    error: "#BE123C",
                    "--rounded-box": "1rem",
                    "--rounded-btn": "1.9rem",
                    "--rounded-badge": "1.9rem",
                },
            },
        ],
    },
};
