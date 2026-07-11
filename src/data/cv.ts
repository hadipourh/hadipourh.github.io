import type { Publication } from '../types/cv';

export const experiences = [
	{
		"time": "2024--Present",
		"title": "Postdoctoral Researcher",
		"company": "Ruhr University Bochum",
		"location": "Bochum, Germany",
		"description": "Conducting research on symmetric-key cryptanalysis under the supervision of Prof. Gregor Leander in the Symmetric Cryptography Group (More info: https://informatik.rub.de/symcrypt/)."
	},
	{
		"time": "2022--2024",
		"title": "Ph.D. Candidate",
		"company": "Graz University of Technology",
		"location": "Graz, Austria",
		"description": "Conducted research on symmetric-key cryptanalysis under the supervision of Dr. Maria Eichlseder. Institute profile (More info: https://www.isec.tugraz.at/people/?groupby=alumni)."
	},
	{
		"time": "2021--2022",
		"title": "Ph.D. Student",
		"company": "Graz University of Technology",
		"location": "Graz, Austria",
		"description": "Conducted research on symmetric-key cryptanalysis under the supervision of Dr. Maria Eichlseder in the Cryptography Research Area (More info: https://www.iaik.tugraz.at/research-area/crypto/)."
	}
];

export const education = [
	{
		"time": "2025--Present",
		"degree": "Postdoc in Computer Science",
		"school": "Ruhr University Bochum",
		"location": "Bochum, Germany",
		"description": ""
	},
	{
		"time": "2021--2024",
		"degree": "Ph.D. in Computer Science",
		"school": "Graz University of Technology",
		"location": "Graz, Austria",
		"description": ""
	},
	{
		"time": "2014--2016",
		"degree": "Master of Pure Mathematics",
		"school": "University of Tehran",
		"location": "Tehran, Iran",
		"description": ""
	},
	{
		"time": "2012--2016",
		"degree": "Bachelor of Electrical Engineering",
		"school": "K. N. Toosi University of Technology",
		"location": "Tehran, Iran",
		"description": ""
	},
	{
		"time": "2010--2014",
		"degree": "Bachelor of Applied Mathematics",
		"school": "K. N. Toosi University of Technology",
		"location": "Tehran, Iran",
		"description": ""
	}
];

export const skills = [
	{
		"category": "Programming Language",
		"level": "Advanced",
		"skills": "Python, C, C++, VHDL"
	},
	{
		"category": "Programming Language",
		"level": "Intermediate",
		"skills": "Java, Assembly(AVR)"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "Math",
		"skills": "SageMath, Matlab, Maple, CoCoA"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "SAT",
		"skills": "PySAT, Cadical, Minisat, CryptoMinisat"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "SMT",
		"skills": "PySMT, Z3, STP"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "MILP",
		"skills": "Gurobi"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "CP",
		"skills": "Minizinc"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "Productivity",
		"skills": "LaTeX, Microsoft Office Tools, Texstudio"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "Platforms",
		"skills": "Linux, Mac, Windows"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "IDEs",
		"skills": "Visual Studio Code, Microsoft Visual Studio, Eclipse"
	},
	{
		"category": "Software, Tools & Packages",
		"level": "Hardware/EDA",
		"skills": "Xilinx ISE, Altium Designer, PSpice, CodeVision, Atmelstudio, Arduino, Proteus"
	}
];

export const publications: Publication[] = [];
// Publications are now auto-generated from DBLP via scripts/update-publications.js
// They are stored in src/data/publications.json and imported by cv.astro
// This keeps publications synchronized between the CV page and publications page

export const teaching = [
	{
		"course": "Cryptanalysis",
		"role": "Guest Lecturer",
		"institution": "Graz University of Technology",
		"time": "Summer 2023, 2024",
		"description": "Course: Cryptanalysis."
	},
	{
		"course": "A Course in Cryptography",
		"role": "Teaching Assistant",
		"institution": "University of Tehran",
		"time": "Fall 2016",
		"description": "Course: A Course in Cryptography."
	},
	{
		"course": "Introduction to Cryptography",
		"role": "Teaching Assistant",
		"institution": "K. N. Toosi University of Technology",
		"time": "Fall 2014",
		"description": "Course: Introduction to Cryptography."
	}
];

export const presentations = [
	{
		"title": "Inria",
		"location": "Paris, France",
		"time": "2024",
		"type": "Visiting Professor Maria Naya-Plasencia's Lab",
		"link": "https://www.inria.fr/en/inria-paris-centre",
		"detailsLink": "http://naya.plasencia.free.fr/Maria/index.php?lg=fr&pg=index"
	},
	{
		"title": "IRISA",
		"location": "Rennes, France",
		"time": "2024",
		"type": "Visiting IRISA Lab",
		"link": "https://www.irisa.fr/en",
		"detailsLink": "https://www.irisa.fr/en"
	},
	{
		"title": "LORIA",
		"location": "Nancy, France",
		"time": "2024",
		"type": "Visiting LORIA Lab",
		"link": "https://www.loria.fr/en/",
		"detailsLink": "https://www.loria.fr/en"
	},
	{
		"title": "University of Hyogo",
		"location": "Kobe, Japan",
		"time": "2024",
		"type": "Visiting Professor Takanori Isobe's Lab",
		"link": "https://www.u-hyogo.ac.jp/english/",
		"detailsLink": "https://sites.google.com/view/takanoriisobe/publication"
	}
];

export const reviews = [
	{
		"title": "Reviewer",
		"venue": "FSE 2027/ToSC 2026-2 through ToSC 2027-1",
		"time": "2027",
		"link": "https://fse.iacr.org/2027/"
	},
	{
		"title": "Reviewer",
		"venue": "ASIACRYPT 2026",
		"time": "2026",
		"link": "https://asiacrypt.iacr.org/2026/"
	},
	{
		"title": "Artifact Review Chair",
		"venue": "FSE 2026/ToSC",
		"time": "2026",
		"link": "https://tosc.iacr.org/index.php/ToSC/artifact_evaluation"
	},
	{
		"title": "Reviewer",
		"venue": "CASCADE 2026",
		"time": "2026",
		"link": "http://cascade-conference.org/index.html"
	},
	{
		"title": "Reviewer",
		"venue": "Designs, Codes and Cryptography (DCC) 2025",
		"time": "2025",
		"link": "https://www.springer.com/journal/10623"
	},
	{
		"title": "Subreviewer",
		"venue": "ASIACRYPT 2025",
		"time": "2025",
		"link": "https://asiacrypt.iacr.org/2025/"
	},
	{
		"title": "Subreviewer",
		"venue": "CRYPTO 2025",
		"time": "2025",
		"link": "https://crypto.iacr.org/2025/"
	},
	{
		"title": "Subreviewer",
		"venue": "Selected Area in Cryptography (SAC) 2025",
		"time": "2025",
		"link": "https://sacworkshop.org"
	},
	{
		"title": "Artifact review committee",
		"venue": "ASIACRYPT 2024",
		"time": "2024",
		"link": "https://asiacrypt.iacr.org/2024/artifacts.php"
	},
	{
		"title": "Subreviewer",
		"venue": "ASIACRYPT 2024",
		"time": "2024",
		"link": "https://asiacrypt.iacr.org/2024/"
	},
	{
		"title": "Subreviewer",
		"venue": "EUROCRYPT 2024",
		"time": "2024",
		"link": "https://eurocrypt.iacr.org/2024/"
	},
	{
		"title": "Subreviewer",
		"venue": "EUROCRYPT 2023",
		"time": "2023",
		"link": "https://eurocrypt.iacr.org/2023/"
	},
	{
		"title": "Subreviewer",
		"venue": "ASIACRYPT 2023",
		"time": "2023",
		"link": "https://asiacrypt.iacr.org/2023/"
	},
	{
		"title": "Subreviewer",
		"venue": "EUROCRYPT 2023",
		"time": "2023",
		"link": "https://eurocrypt.iacr.org/2023/"
	},
	{
		"title": "Subreviewer",
		"venue": "CRYPTO 2022",
		"time": "2022",
		"link": "https://crypto.iacr.org/2022/"
	},
	{
		"title": "Subreviewer",
		"venue": "ASIACRYPT 2022",
		"time": "2022",
		"link": "https://asiacrypt.iacr.org/2022/"
	},
	{
		"title": "Reviewer",
		"venue": "IET Information Security 2022",
		"time": "2022",
		"link": "https://ietresearch.onlinelibrary.wiley.com"
	},
	{
		"title": "Reviewer",
		"venue": "Designs, Codes and Cryptography (DCC) 2022",
		"time": "2022",
		"link": "https://www.springer.com/journal/10623"
	}
];

export const honors = [
	{
		"title": "Winner: NSUCRYPTO 2019",
		"description": "October 13--21, Competition results",
		"time": "2019",
		"link": "https://nsucrypto.nsu.ru/archive/2019/total_results/round/1/section/2/#data",
		"icon": "🏆"
	},
	{
		"title": "Bronze Medal: 38th National Mathematical Competition for University Students",
		"description": "Kerman, Iran, May, Competition website",
		"time": "2014",
		"link": "http://www.ims.ir",
		"icon": "🥉"
	},
	{
		"title": "Bronze Medal: 37th National Mathematical Competition for University Students",
		"description": "Semnan, Iran, May, Competition website",
		"time": "2013",
		"link": "http://www.ims.ir",
		"icon": "🥉"
	}
];

export const conferences = [
	{
		"title": "FSE 2026",
		"location": "Singapore, Singapore, March 23--27",
		"role": "Attendee",
		"time": "2026"
	},
	{
		"title": "ASK 2026",
		"location": "Nanyang Technological University, Singapore, March 19--22",
		"role": "Invited attendee",
		"time": "2026"
	},
	{
		"title": "FSE 2025",
		"location": "Rome, Italy, March 17--21",
		"role": "Attendee with accepted paper",
		"time": "2025"
	},
	{
		"title": "SKCAM 2025",
		"location": "Rome, Italy",
		"role": "Invited speaker",
		"time": "2025"
	},
	{
		"title": "ASK 2024",
		"location": "TCG CREST, Kolkata, India, December 14--17",
		"role": "Invited speaker",
		"time": "2024"
	},
	{
		"title": "CRYPTO 2024",
		"location": "Santa Barbara, USA, August 18--22",
		"role": "Paper presentation",
		"time": "2024"
	},
	{
		"title": "Beating Real-Time Crypto: Solutions and Analysis",
		"location": "Lorentz Center, Leiden, Netherlands, April 22--26",
		"role": "Invited attendee and speaker",
		"time": "2024"
	},
	{
		"title": "FSE 2024",
		"location": "Leuven, Belgium, March 25--29",
		"role": "Paper presentation",
		"time": "2024"
	},
	{
		"title": "EUROCRYPT 2023",
		"location": "Lyon, France, April 23--27",
		"role": "Paper presentation",
		"time": "2023"
	},
	{
		"title": "FSE 2023",
		"location": "Kobe, Japan, March 20--24",
		"role": "Paper presentation",
		"time": "2023"
	},
	{
		"title": "FRISIACRYPT 2022",
		"location": "Terschelling, Netherlands, September 25--28",
		"role": "Invited attendee",
		"time": "2022"
	},
	{
		"title": "CHES 2022",
		"location": "Leuven, Belgium, September 18--21",
		"role": "Paper presentation",
		"time": "2022"
	},
	{
		"title": "ACNS 2022",
		"location": "Rome, Italy, June 20--23",
		"role": "Paper presentation",
		"time": "2022"
	},
	{
		"title": "FSE 2022",
		"location": "Athens, Greece, March 20--25",
		"role": "Paper presentation",
		"time": "2022"
	},
	{
		"title": "Symmetric Cryptography in Theory and Practice",
		"location": "ISC Winter School on Information Security and Cryptology (ISCwsISC 2020), Iran University of Science and Technology, February 2--3",
		"role": "Speaker",
		"time": "2020"
	},
	{
		"title": "16th International ISC Conference on Information Security and Cryptology (ISCISC 2019)",
		"location": "Ferdowsi University of Mashhad, Mashhad, Iran, August 28--29",
		"role": "Attendee",
		"time": "2019"
	},
	{
		"title": "9th IPM-HPC Workshop on Multi-core Systems and Graphic Processors",
		"location": "Institute for Research in Fundamental Sciences (IPM), Tehran, Iran, June 8--9",
		"role": "Attendee",
		"time": "2019"
	},
	{
		"title": "8th IPM-HPC Workshop on Multi-core Systems and Parallel Platforms",
		"location": "Institute for Research in Fundamental Sciences (IPM), Tehran, Iran, February 20--21",
		"role": "Attendee",
		"time": "2019"
	},
	{
		"title": "Selected Areas in Post-Quantum Cryptography",
		"location": "Sharif University of Technology, Tehran, Iran, February 13--14",
		"role": "Attendee",
		"time": "2019"
	},
	{
		"title": "Advanced MATLAB Workshop",
		"location": "IEEE Student Branch, Faculty of Electrical Engineering, K. N. Toosi University of Technology, Tehran, Iran",
		"role": "Attendee",
		"time": "2014"
	}
];

export const memberships = [
	{
		"title": "International Association for Cryptologic Research",
		"description": "Member since 2021-Present",
		"time": "2021-Present"
	},
	{
		"title": "Iranian Mathematical Society",
		"description": "Member since 2012-2013",
		"time": "2012-2013"
	}
];

export const interests = [
	{
		"title": "Tennis",
		"description": "Playing tennis for recreation and sport",
		"icon": "🎾"
	},
	{
		"title": "Swimming",
		"description": "Regular swimming for fitness and relaxation",
		"icon": "🏊‍♂️"
	},
	{
		"title": "Hiking and Mountain Climbing",
		"description": "Outdoor adventures and nature exploration",
		"icon": "🏔️"
	},
	{
		"title": "Biking",
		"description": "Cycling for fitness and exploration",
		"icon": "🚴‍♂️"
	},
	{
		"title": "Traveling",
		"description": "Exploring new cultures and destinations",
		"icon": "✈️"
	},
	{
		"title": "Movies and Documentaries",
		"description": "Watching films and educational content",
		"icon": "🎬"
	},
	{
		"title": "Reading Books",
		"description": "Reading literature and academic materials",
		"icon": "📚"
	},
	{
		"title": "Programming",
		"description": "Software development and technical projects",
		"icon": "💻"
	},
	{
		"title": "Music (Guitar, Piano)",
		"description": "Playing musical instruments and composition",
		"icon": "🎵"
	},
	{
		"title": "Puzzle-Solving and Chess",
		"description": "Strategic games and mental challenges",
		"icon": "♟️"
	}
];

export const languages: { language: string; level: string; proficiency: number; color: string; icon: string }[] = [
	{
		language: "Persian",
		level: "Mother tongue",
		proficiency: 5,
		color: "text-green-600",
		icon: "🏠"
	},
	{
		language: "English",
		level: "Advanced",
		proficiency: 4,
		color: "text-blue-600",
		icon: "🌍"
	},
	{
		language: "German",
		level: "Learning",
		proficiency: 1,
		color: "text-purple-600",
		icon: "🌱"
	},
	{
		language: "Chinese",
		level: "Learning",
		proficiency: 1,
		color: "text-purple-600",
		icon: "🌱"
	}
];
