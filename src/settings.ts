export const profile = {
	fullName: 'Hosein Hadipour',
	namesMultilingual: {
		english: 'Hosein Hadipour',
		persian: 'حسین هادی پور',
		chinese: '侯森 哈迪普尔'
	},
	title: 'Postdoctoral Researcher',
	institute: 'Ruhr University Bochum',
	author_name: 'Hosein Hadipour', // Author name to be highlighted in the papers section
	research_areas: [
		{ title: 'Cryptanalysis', description: 'Broadly interested in cryptanalysis in all its forms, with a particular focus on symmetric-key primitives. This includes unified approaches to analyze ciphers/primitives through various techniques such as differential, linear, boomerang, integral, impossible-differential, zero-correlation, and differential-linear attacks.', field: 'cryptography' },
		{ title: 'Automated Cryptanalysis', description: 'Interested in the automation of cryptanalysis, with emphasis on designing tools and algorithms for systematic security evaluation of ciphers, such as SAT/SMT-based approaches and dedicated frameworks.', field: 'automation' },
		{ title: 'Applied Mathematics and Interdisciplinary Methods', description: 'Exploring connections between mathematics, logic, and computer science, and applying advances from one area to solve challenges in another, particularly in cryptography and security.', field: 'applied-mathematics' },
		{ title: 'Side-Channel Analysis', description: 'Exploring physical attack vectors against cryptographic implementations, such as power analysis, electromagnetic analysis, and fault injection techniques.', field: 'hardware-security' },
		{ title: 'Logic', description: 'Study of formal logic and proof theory, with applications in computer science and cryptography, such as verification, reasoning systems, and complexity theory.', field: 'logic' },
		{ title: 'Constraint Programming', description: 'Application of constraint programming to cryptographic problems and beyond, such as satisfiability, combinatorial optimization, and automated reasoning.', field: 'constraint-programming' },
		{ title: 'Information Security', description: 'General interest in securing information systems, with focus on principles and practices such as threat modeling, risk management, and security evaluation.', field: 'information-security' },
	],

}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'hsn.hadipour@gmail.com',
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
