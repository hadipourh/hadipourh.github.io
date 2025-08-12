export const profile = {
	fullName: 'Hosein Hadipour',
	title: 'Postdoctoral Researcher',
	institute: 'Ruhr University Bochum',
	author_name: 'Hosein Hadipour', // Author name to be highlighted in the papers section
	research_areas: [
		{ title: 'Cryptanalysis', description: 'Differential, linear, and integral cryptanalysis of symmetric-key primitives', field: 'cryptography' },
		{ title: 'Automated Cryptanalysis', description: 'Tools and algorithms for automated security analysis of ciphers', field: 'automation' },
		{ title: 'Side-Channel Analysis', description: 'Power analysis and fault attacks on cryptographic implementations', field: 'hardware-security' },
		{ title: 'Block Cipher Security', description: 'Security analysis of modern lightweight and traditional block ciphers', field: 'cipher-analysis' },
	],
}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'hosein.hadipour@rub.de',
	github: 'https://github.com/hadipourh',
	scholar: 'https://scholar.google.com/citations?user=3gNyYaAAAAAJ&hl=en',
	dblp: 'https://dblp.org/pid/244/8979.html',
	iacr: 'https://www.iacr.org/cryptodb/data/author.php?authorkey=11275',
	orcid: 'https://orcid.org/0000-0002-3820-3765',
	linkedin: 'https://www.linkedin.com/in/hosein-h-942499170/',
	x: 'https://x.com/HoseinHadipour',
	researchgate: 'https://www.researchgate.net/profile/Hosein-Hadipour?ev=hdr_xprf',
	gitlab: '',
	inspire: '',
	arxiv: '',
}

export const template = {
	website_url: 'https://localhost:4321', // Astro needs to know your site’s deployed URL to generate a sitemap. It must start with http:// or https://
	menu_left: false,
	transitions: true,
	lightTheme: 'light', // Select one of the Daisy UI Themes or create your own
	darkTheme: 'dark', // Select one of the Daisy UI Themes or create your own
	excerptLength: 200,
	postPerPage: 5,
    base: '' // Repository name starting with /
}

export const seo = {
	default_title: 'Astro Academia',
	default_description: 'Astro Academia is a template for academic websites.',
	default_image: '/images/astro-academia.png',
}
