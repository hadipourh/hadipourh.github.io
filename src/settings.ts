export const profile = {
	fullName: 'Hosein Hadipour',
	title: 'Postdoctoral Researcher',
	institute: 'Ruhr University Bochum',
	author_name: 'Hosein Hadipour', // Author name to be highlighted in the papers section
	research_areas: [
		{ title: 'Cryptanalysis', description: 'Differential, linear, boomerang, integral, impossible-differential, zero-correlation, and differential-linear cryptanalysis of symmetric-key primitives', field: 'cryptography' },
		{ title: 'Automated Cryptanalysis', description: 'Tools and algorithms for automated security analysis of ciphers', field: 'automation' },
		{ title: 'Side-Channel Analysis', description: 'Side-channel and fault attacks on cryptographic implementations', field: 'hardware-security' },
		{ title: 'Information Security', description: 'General principles and practices for securing information systems', field: 'information-security' },
		{ title: 'Constraint Programming', description: 'Constraint programming techniques for satisfiability and optimization problems', field: 'constraint-programming' },
		{ title: 'Logic', description: 'Formal logic, proof theory, and their applications in computer science', field: 'logic' },
	],
}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'hsn.hadipour@gmail.com,hossein.hadipour@ruhr-uni-bochum.de',
	github: 'https://github.com/hadipourh',
	scholar: 'https://scholar.google.com/citations?user=3gNyYaAAAAAJ&hl=en',
	dblp: 'https://dblp.org/pid/244/8979.html',
	iacr: 'https://www.iacr.org/cryptodb/data/author.php?authorkey=11275',
	orcid: 'https://orcid.org/0000-0002-3820-3765',
	linkedin: 'https://www.linkedin.com/in/hosein-h-942499170/',
	x: 'https://x.com/HoseinHadipour',
	researchgate: '',
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
