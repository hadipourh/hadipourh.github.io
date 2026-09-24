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
 * Get a solid color class for text based on index
 * Used for text elements to ensure readability
 * Professional hacker/cyberpunk color scheme - NO purple/violet
 */
export function getTextColorClass(index: number): string {
	const colors = [
		'text-cyan-600 dark:text-cyan-400',           // Cyber cyan
		'text-emerald-600 dark:text-emerald-400',     // Matrix green
		'text-blue-600 dark:text-blue-400',           // Deep blue
		'text-slate-700 dark:text-slate-300',         // Professional gray
		'text-teal-600 dark:text-teal-400',           // Tech teal
		'text-green-600 dark:text-green-400'          // Terminal green
	]
	return colors[index % colors.length]
}
