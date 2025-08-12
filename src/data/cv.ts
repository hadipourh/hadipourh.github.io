export const experiences = [
	{
		company: 'Ruhr University Bochum',
		time: '2023 - Present',
		title: 'Postdoctoral Researcher',
		location: 'Bochum, Germany',
		description: 'Postdoctoral researcher at the Faculty of Computer Science, specializing in cryptanalysis of symmetric-key primitives and automated security analysis tools.',
	},
	{
		company: 'Graz University of Technology',
		time: '2022 - 2023',
		title: 'Researcher',
		location: 'Graz, Austria',
		description: 'Researcher at the Institute of Applied Information Processing and Communications (IAIK), focusing on cryptanalysis and automated attack discovery.',
	},
	{
		company: 'University of Tehran',
		time: '2019 - 2022',
		title: 'Ph.D. Candidate / Researcher',
		location: 'Tehran, Iran',
		description: 'Conducted research in cryptanalysis under the Department of Mathematics and Computer Science, focusing on differential cryptanalysis, boomerang attacks, and automated cryptanalysis tools.',
	},
];

export const education = [
	{
		school: 'University of Tehran',
		time: '2019 - 2023',
		degree: 'Ph.D. in Computer Science',
		location: 'Tehran, Iran',
		description: 'Specialized in cryptanalysis of symmetric-key cryptography with focus on differential cryptanalysis, boomerang attacks, and automated cryptanalysis methods.',
	},
	{
		school: 'University of Tehran',
		time: '2017 - 2019',
		degree: 'M.Sc. in Computer Science',
		location: 'Tehran, Iran',
		description: 'Master\'s degree focusing on cryptography and information security with emphasis on symmetric-key cryptography and block cipher analysis.',
	},
	// Add undergraduate information if available
];

export const skills = [
	{
		title: 'Cryptanalysis Techniques',
		description: 'Differential cryptanalysis, Linear cryptanalysis, Boomerang attacks, Rectangle attacks, Integral cryptanalysis, Impossible differential attacks',
	},
	{
		title: 'Automated Tools',
		description: 'Constraint programming (MiniZinc), SAT/SMT solvers, Automated cryptanalysis frameworks, MILP modeling',
	},
	{
		title: 'Programming & Tools',
		description: 'Python, C/C++, SageMath, MiniZinc, LaTeX, Git, Cryptographic libraries (OpenSSL, Crypto++)',
	},
	{
		title: 'Research & Academic',
		description: 'Peer review, Conference presentations, Academic writing, Collaboration with international teams',
	},
	{
		title: 'Cipher Analysis',
		description: 'Lightweight ciphers (SKINNY, CRAFT, PRESENT), Standard ciphers (AES, CLEFIA), ARX designs, Feistel structures',
	},
];

export const publications = [
	{
		title: 'Revisiting Differential-Linear Attacks via a Boomerang Perspective with Application to AES, Ascon, CLEFIA, SKINNY, PRESENT, KNOT, TWINE, WARP, LBlock, Simeck, and SERPENT',
		authors: 'Hosein Hadipour, Patrick Derbez, Maria Eichlseder',
		journal: 'CRYPTO 2024',
		time: '2024',
		link: 'https://doi.org/10.1007/978-3-031-68385-5_2',
		abstract: 'We present a new perspective on differential-linear attacks through boomerang analysis, providing improved attacks on multiple symmetric-key primitives.',
	},
	{
		title: 'Cryptanalysis of QARMAv2',
		authors: 'Hosein Hadipour, Yosuke Todo',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2024',
		link: 'https://doi.org/10.46586/tosc.v2024.i1.188-213',
		abstract: 'Comprehensive cryptanalysis of the QARMAv2 block cipher, demonstrating various attack vectors and security vulnerabilities.',
	},
	{
		title: 'Improved Search for Integral, Impossible Differential and Zero-Correlation Attacks Application to Ascon, ForkSKINNY, SKINNY, MANTIS, PRESENT and QARMAv2',
		authors: 'Hosein Hadipour, Simon Gerhalter, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2024',
		link: 'https://doi.org/10.46586/tosc.v2024.i1.234-325',
		abstract: 'Enhanced automated search techniques for finding cryptanalytic attacks on lightweight block ciphers.',
	},
	{
		title: 'Finding Complete Impossible Differential Attacks on AndRX Ciphers and Efficient Distinguishers for ARX Designs',
		authors: 'Debasmita Chakraborty, Hosein Hadipour, Phuong Hoa Nguyen, Maria Eichlseder',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2024',
		link: 'https://doi.org/10.46586/tosc.v2024.i3.84-176',
		abstract: 'Novel methods for finding impossible differential attacks on ARX and AndRX cipher constructions.',
	},
	{
		title: 'Finding the Impossible: Automated Search for Full Impossible-Differential, Zero-Correlation, and Integral Attacks',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Maria Eichlseder',
		journal: 'EUROCRYPT 2023',
		time: '2023',
		link: 'https://doi.org/10.1007/978-3-031-30634-1_5',
		abstract: 'Comprehensive automated framework for finding various types of cryptanalytic attacks on block ciphers.',
	},
	{
		title: 'Throwing Boomerangs into Feistel Structures Application to CLEFIA, WARP, LBlock, LBlock-s and TWINE',
		authors: 'Hosein Hadipour, Marcel Nageler, Maria Eichlseder',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2022',
		link: 'https://doi.org/10.46586/tosc.v2022.i3.271-302',
		abstract: 'Application of boomerang cryptanalysis to Feistel-based block ciphers with practical attack implementations.',
	},
	{
		title: 'Integral Cryptanalysis of WARP based on Monomial Prediction',
		authors: 'Hosein Hadipour, Maria Eichlseder',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2022',
		link: 'https://doi.org/10.46586/tosc.v2022.i2.92-112',
		abstract: 'Novel integral cryptanalysis technique using monomial prediction for the WARP block cipher.',
	},
	{
		title: 'Autoguess: A Tool for Finding Guess-and-Determine Attacks and Key Bridges',
		authors: 'Hosein Hadipour, Maria Eichlseder',
		journal: 'ACNS 2022',
		time: '2022',
		link: 'https://doi.org/10.1007/978-3-031-09234-3_12',
		abstract: 'Automated tool for discovering guess-and-determine attacks on cryptographic primitives.',
	},
	{
		title: 'Improved Rectangle Attacks on SKINNY and CRAFT',
		authors: 'Hosein Hadipour, Nasour Bagheri, Ling Song',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2021',
		link: 'https://doi.org/10.46586/tosc.v2021.i2.140-198',
		abstract: 'Enhanced rectangle attack methodology with applications to SKINNY and CRAFT lightweight ciphers.',
	},
	{
		title: 'Comprehensive security analysis of CRAFT',
		authors: 'Hosein Hadipour, Sadegh Sadeghi, Majid M. Niknam, Ling Song, Nasour Bagheri',
		journal: 'IACR Transactions on Symmetric Cryptology',
		time: '2019',
		link: 'https://doi.org/10.13154/tosc.v2019.i4.290-317',
		abstract: 'Complete security evaluation of the CRAFT lightweight block cipher against various cryptanalytic techniques.',
	},
];
