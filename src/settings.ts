export const profile = {
	fullName: 'Hosein Hadipour',
	title: 'Cryptography Researcher & PhD in Computer Science',
	institute: 'Ruhr University Bochum, Germany',
	author_name: 'Hosein Hadipour', // Author name to be highlighted in the papers section
	research_areas: [
		{ title: 'Cryptanalysis', description: 'Automated search methods for differential, linear, and integral attacks on symmetric-key cryptographic primitives', field: 'cryptography' },
		{ title: 'Side-Channel Analysis', description: 'Fault attacks and implementation security of cryptographic algorithms', field: 'security' },
		{ title: 'Information Security', description: 'Practical security assessment of cryptographic primitives and protocols', field: 'security' },
		{ title: 'Automated Reasoning', description: 'Constraint programming and SAT-based approaches in cryptanalysis', field: 'computer-science' },
	],
}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: '',
	linkedin: 'https://www.linkedin.com/in/hosein-h-942499170/',
	x: 'https://twitter.com/HoseinHadipour',
	github: 'https://github.com/hadipourh',
	gitlab: '',
	scholar: 'https://scholar.google.com/citations?user=3gNyYaAAAAAJ&hl=en',
	inspire: '',
	arxiv: '',
}

export const template = {
	website_url: 'https://hadipourh.github.io', // Astro needs to know your site's deployed URL to generate a sitemap. It must start with http:// or https://
	menu_left: false,
	transitions: true,
	lightTheme: 'synthwave', // Consistent cyberpunk hacker theme for both modes
	darkTheme: 'synthwave', // Retro cyberpunk hacker theme with neon accents
	excerptLength: 200,
	postPerPage: 5,
    base: '' // Repository name starting with /
}

export const seo = {
	default_title: 'Hosein Hadipour - Cryptography Researcher',
	default_description: 'Hosein Hadipour is a cryptography researcher and PhD in Computer Science at Ruhr University Bochum, specializing in cryptanalysis and automated attack methods.',
	default_image: '/images/astro-academia.png',
}
