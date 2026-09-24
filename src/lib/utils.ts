import { profile, template } from '../settings'

export function highlightAuthor(authors: string): string{
	if (!authors) return '';
	const author = authors.split(', ')
	if (author.includes(profile.author_name)){
		return authors.replace(profile.author_name, `<span class='font-medium underline'>${profile.author_name}</span>`)
	}
	return authors
}

export function trimExcerpt(excerpt: string): string {
	const excerptLength = template.excerptLength
	return excerpt.length > excerptLength ? `${excerpt.substring(0, excerptLength)}...` : excerpt
}

/**
 * Semantic text colours.
 *
 * These replace the old `getTextColorClass(index)`, which picked a hue from
 * its position in an array — so colour was decoration, not information. Here
 * each role means something, and every value resolves through the DaisyUI
 * theme (see tailwind.config.mjs) so the palette lives in exactly one place.
 *
 *   heading  structure   — section titles, near-white, deliberately uncoloured
 *   accent   interact    — links, active state, the figures that matter (amber)
 *   dim      secondary   — dates, venues, captions
 *   ok       live        — terminal / success only (green)
 *   warn     caution     — reserved, never decorative
 *   error    failure     — reserved, never decorative
 */
export const text = {
	heading: 'text-base-content',
	accent: 'text-primary',
	dim: 'text-base-content/60',
	ok: 'text-success',
	warn: 'text-warning',
	error: 'text-error',
} as const

export type TextRole = keyof typeof text
