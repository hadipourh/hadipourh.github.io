export const experiences = [
	{
		company: 'Ruhr University Bochum',
		time: '2020 - Present',
		title: 'PhD Candidate & Research Assistant',
		location: 'Bochum, Germany',
		description: 'Conducting research in cryptanalysis and automated attack methods for symmetric-key cryptographic primitives. Focus on differential, linear, and integral attacks using constraint programming and SAT-based approaches.',
	},
	{
		company: 'Graz University of Technology',
		time: '2018 - 2020',
		title: 'PhD Student',
		location: 'Graz, Austria',
		description: 'Research in cryptography and information security with emphasis on side-channel analysis and fault attacks on cryptographic implementations.',
	},
];

export const education = [
	{
		school: 'Graz University of Technology',
		time: '2020',
		degree: 'PhD in Computer Science',
		location: 'Graz, Austria',
		description: 'Dissertation on automated cryptanalysis methods and differential attacks on symmetric-key cryptographic primitives.',
	},
	{
		school: 'Sharif University of Technology',
		time: '2016',
		degree: 'Master\'s in Computer Science',
		location: 'Tehran, Iran',
		description: 'Specialized in cryptography and information security with focus on symmetric-key cryptographic algorithms.',
	},
	{
		school: 'Sharif University of Technology',
		time: '2014',
		degree: 'Bachelor\'s in Computer Engineering',
		location: 'Tehran, Iran',
		description: 'Foundation in computer science and engineering with emphasis on algorithms and mathematical foundations.',
	},
];

export const skills = [
	{
		title: 'Cryptanalysis',
		description: 'Differential, Linear, and Integral Attacks, Automated Search Methods, SAT-based Cryptanalysis',
	},
	{
		title: 'Programming & Tools',
		description: 'Python, C/C++, SageMath, CryptoMiniSat, MILP/CP Solvers, LaTeX',
	},
	{
		title: 'Cryptographic Primitives',
		description: 'Block Ciphers, Stream Ciphers, Hash Functions, Message Authentication Codes',
	},
	{
		title: 'Research Methods',
		description: 'Constraint Programming, Boolean Satisfiability, Mixed-Integer Linear Programming',
	},
];

export const publications = [
	{
		title: 'Revisiting Differential-Linear Attacks via a Boomerang Perspective',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Niels Ferguson, Kosei Sakamoto, Yosuke Todo',
		journal: 'CRYPTO 2024',
		time: '2024',
		link: 'https://ia.cr/2024/255',
		abstract: 'We present a novel boomerang perspective on differential-linear attacks, providing new insights into the structural connections between different cryptanalytic techniques.',
	},
	{
		title: 'Improved Search for Integral, Impossible-Differential and Zero-Correlation Attacks',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'FSE 2024',
		time: '2024',
		link: 'https://ia.cr/2023/1701',
		abstract: 'We develop improved automated methods for finding integral, impossible-differential and zero-correlation attacks with applications to modern ciphers.',
	},
	{
		title: 'Cryptanalysis of QARMAv2',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'FSE 2024',
		time: '2024',
		link: 'https://ia.cr/2023/1833',
		abstract: 'We present comprehensive cryptanalytic results on the QARMAv2 tweakable block cipher, including impossible differential and integral attacks.',
	},
	{
		title: 'Finding the Impossible: Automated Search for Full Impossible-Differential, Zero-Correlation, and Integral Attacks',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'EUROCRYPT 2023',
		time: '2023',
		link: 'https://ia.cr/2022/1147',
		abstract: 'We introduce unified automated methods for finding impossible-differential, zero-correlation, and integral attacks on symmetric-key primitives.',
	},
	{
		title: 'Throwing Boomerangs into Feistel Structures',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'FSE 2023',
		time: '2023',
		link: 'https://ia.cr/2022/745',
		abstract: 'We present new boomerang attacks on Feistel structures with applications to CLEFIA, WARP, LBlock, LBlock-s and TWINE.',
	},
	{
		title: 'Integral Cryptanalysis of WARP based on Monomial Prediction',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'FSE 2023',
		time: '2023',
		link: 'https://ia.cr/2022/729',
		abstract: 'We develop monomial prediction techniques for integral cryptanalysis with a detailed analysis of the WARP block cipher.',
	},
	{
		title: 'Practical Multiple Persistent Fault Analysis',
		authors: 'Hadi Soleimany, Nasour Bagheri, Hosein Hadipour, Prasanna Ravi, Shivam Bhasin, Sara Mansouri',
		journal: 'CHES 2022',
		time: '2022',
		link: 'https://tches.iacr.org/index.php/TCHES/article/view/9301',
		abstract: 'We present practical fault injection attacks using multiple persistent faults with applications to AES implementations.',
	},
	{
		title: 'Autoguess: A Tool for Finding Guess-and-Determine Attacks and Key Bridges',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'ACNS 2022',
		time: '2022',
		link: 'https://eprint.iacr.org/2021/1529',
		abstract: 'We introduce Autoguess, an automated tool for finding guess-and-determine attacks and key bridges in symmetric-key cryptography.',
	},
	{
		title: 'Improved Rectangle Attacks on SKINNY and CRAFT',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'FSE 2022',
		time: '2022',
		link: 'https://tosc.iacr.org/index.php/ToSC/article/view/8908',
		abstract: 'We present improved rectangle attacks on the SKINNY and CRAFT lightweight block ciphers using automated search techniques.',
	},
	{
		title: 'Comprehensive Security Analysis of CRAFT',
		authors: 'Hosein Hadipour, Nasour Bagheri, Song Ling',
		journal: 'FSE 2020',
		time: '2020',
		link: 'https://tosc.iacr.org/index.php/ToSC/article/view/8466',
		abstract: 'We provide a comprehensive security analysis of the CRAFT block cipher including differential, linear, and impossible differential attacks.',
	},
];
