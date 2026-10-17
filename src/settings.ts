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
		{ title: 'Symmetric-Key Cryptanalysis and Design', description: 'Security analysis and design of block ciphers, hash functions, and permutations, using differential, linear, differential-linear, boomerang, integral, impossible-differential, and zero-correlation attacks.', field: 'cryptography' },
		{ title: 'Automated Cryptanalysis', description: 'Automating the search for attacks with methods ranging from SAT, SMT, MILP, and constraint-programming models to ad hoc search algorithms and greedy heuristics. More recently, exploring how we can use LLMs to find structural properties and even new attacks, and to automate the remaining manual steps, from modeling a cipher to writing and testing attack code.', field: 'automation' },
		{ title: 'Mathematical Foundations', description: 'Logic and Boolean algebra, algebra and graph theory, and probability and statistics as the toolkit behind cryptanalysis.', field: 'applied-mathematics' },
		{ title: 'Security and Reliability of AI Agents', description: 'How AI agents that use tools and act on real systems can be attacked or fail, and how to make them secure and reliable.', field: 'ai-agents' },
		{ title: 'Side-Channel and Fault Analysis', description: 'Physical attacks on cryptographic implementations, especially fault attacks and side-channel leakage.', field: 'hardware-security' },
		{ title: 'High-Performance and Secure Implementations', description: 'Fast, reliable implementations of attacks and primitives, including GPU (CUDA) key recovery and experimental verification of attack complexities.', field: 'implementation' },
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
	website_url: 'https://hoseinhadipour.com', // Canonical production URL (github.io 301-redirects here)
	menu_left: false,
	transitions: true,
	lightTheme: 'corporate', // Select one of the Daisy UI Themes or create your own
	darkTheme: 'night', // Select one of the Daisy UI Themes or create your own
	excerptLength: 200,
	postPerPage: 5,
    base: '' // Repository name starting with /
}

export const seo = {
	default_title: 'Hosein Hadipour',
	default_description: 'Hosein Hadipour - Postdoctoral Researcher in Cryptography at Ruhr University Bochum',
	default_image: '/images/profilepic1.jpg',
}
