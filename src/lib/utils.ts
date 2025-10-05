import { profile } from '../settings'
import { template } from '../settings'

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
 * Used for consistent gradient styling across pages
 */
export function getGradientClass(index: number): string {
	const gradients = [
		'from-primary via-secondary to-accent',
		'from-success via-info to-warning',
		'from-error via-primary to-success',
		'from-accent via-warning to-error',
		'from-info via-accent to-primary',
		'from-warning via-success to-info'
	]
	return gradients[index % gradients.length]
}
