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
 * Get a gradient class based on index
 * Used for decorative backgrounds and borders only
 * Professional hacker/cyberpunk color scheme
 */
export function getGradientClass(index: number): string {
	const gradients = [
		'from-cyan-500 via-blue-600 to-purple-700',        // Cyber blue to purple
		'from-emerald-500 via-teal-600 to-cyan-700',       // Matrix green to cyan
		'from-indigo-500 via-purple-600 to-pink-700',      // Deep purple gradient
		'from-slate-500 via-gray-600 to-zinc-700',         // Professional gray scale
		'from-blue-500 via-indigo-600 to-violet-700',      // Deep blue spectrum
		'from-teal-500 via-emerald-600 to-green-700'       // Tech green gradient
	]
	return gradients[index % gradients.length]
}

/**
 * Get a solid color class for text based on index
 * Used for text elements to ensure readability
 * Professional hacker/cyberpunk color scheme with monotonic colors
 */
export function getTextColorClass(index: number): string {
	const colors = [
		'text-cyan-600 dark:text-cyan-400',           // Cyber cyan
		'text-emerald-600 dark:text-emerald-400',     // Matrix green
		'text-indigo-600 dark:text-indigo-400',       // Deep indigo
		'text-slate-700 dark:text-slate-300',         // Professional gray
		'text-blue-600 dark:text-blue-400',           // Deep blue
		'text-teal-600 dark:text-teal-400'            // Tech teal
	]
	return colors[index % colors.length]
}
