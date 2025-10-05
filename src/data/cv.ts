import type { Publication } from '../types/cv';

export const experiences = [
	{
		"time": "2024--Present",
		"title": "Postdoctoral Researcher",
		"company": "Ruhr University Bochum",
		"location": "",
		"description": "Working on symmetric-key cryptanalysis under the supervision of Prof. Gregor Leander. More info: https://informatik.rub.de/symcrypt/"
	},
	{
		"time": "2022--2024",
		"title": "Ph.D. Candidate",
		"company": "Graz Univeristy of Technology",
		"location": "",
		"description": "Working on symmetric-key cryptanalysis under the supervision of Dr. Maria Eichlseder. More info: https://www.isec.tugraz.at/people/?groupby=alumni"
	},
	{
		"time": "2021--2022",
		"title": "Ph.D. Student",
		"company": "Graz Univeristy of Technology",
		"location": "",
		"description": "Working on symmetric-key cryptanalysis under the supervision of Dr. Maria Eichlseder. More info: https://www.iaik.tugraz.at/research-area/crypto/"
	}
];

export const education = [
	{
		"time": "2025--Present",
		"degree": "Postdoc in Computer Science",
		"school": "Ruhr Univeristy Bochum",
		"location": "Bochum, Germany",
		"description": ""
	},
	{
		"time": "2021--2024",
		"degree": "Ph.D. in Computer Science",
		"school": "Graz Univeristy of Technology",
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
		"category": "Software, Tools \& Packages",
		"level": "Math",
		"skills": "SageMath, Matlab, Maple, CoCoA"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "SAT",
		"skills": "PySAT, Cadical, Minisat, CryptoMinisat"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "SMT",
		"skills": "PySMT, Z3, STP"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "MILP",
		"skills": "Pulp, Gurobi"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "CP",
		"skills": "Minizinc"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "Office",
		"skills": "LaTeX, Microsoft Office Tools, Texstudio"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "OS",
		"skills": "Linux, Windows"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "IDE",
		"skills": "Visual Studio Code, Microsoft Visual Studio, Eclipse"
	},
	{
		"category": "Software, Tools \& Packages",
		"level": "Electrical Engineering Softwares",
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
		"time": "Summer 2023 and 2024",
		"description": "Guest Lecturer, Graz University of Technology, Summer 2023 and 2024"
	},
	{
		"course": "A Course in Cryptography",
		"role": "Teaching Assistant",
		"institution": "University of Tehran",
		"time": "Fall 2016",
		"description": "Teaching Assistant, University of Tehran, Fall 2016"
	},
	{
		"course": "Introduction to Cryptography",
		"role": "Teaching Assistant",
		"institution": "K. N. Toosi University",
		"time": "Fall 2014",
		"description": "Teaching Assistant, K. N. Toosi University, Fall 2014"
	}
];

export const presentations = [
	{
		"title": "FSE 2025",
		"location": "Rome, Italy, March 2025",
		"time": "2025",
		"type": "Attendee with accepted paper",
		"link": "https://fse.iacr.org/2025/",
		"detailsLink": "https://ia.cr/2024/1359"
	},
	{
		"title": "SKCAM 2025",
		"location": "Rome, Italy, March 2025",
		"time": "2025",
		"type": "Invited Speaker",
		"link": "https://skcamworkshop.github.io/skcam2025/",
		"detailsLink": "https://skcamworkshop.github.io/skcam2025/"
	},
	{
		"title": "CRYPTO 2024",
		"location": "Santa Barbara, USA, August 2024",
		"time": "2024",
		"type": "Paper presentation",
		"link": "https://crypto.iacr.org/2024/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "Inria",
		"location": "Paris, France, May 2024",
		"time": "2024",
		"type": "Visiting Professor Maria Naya-Plasencia's Lab",
		"link": "https://www.inria.fr/en/inria-paris-centre",
		"detailsLink": "http://naya.plasencia.free.fr/Maria/index.php?lg=fr&pg=index"
	},
	{
		"title": "IRISA",
		"location": "Rennes, France, May 2024",
		"time": "2024",
		"type": "Visiting IRISA Lab",
		"link": "https://www.irisa.fr/en",
		"detailsLink": "https://www.irisa.fr/en"
	},
	{
		"title": "LORIA",
		"location": "Nancy, France, May 2024",
		"time": "2024",
		"type": "Visiting LORIA Lab",
		"link": "https://www.loria.fr/en/",
		"detailsLink": "https://www.loria.fr/en/"
	},
	{
		"title": "Lorentz Center",
		"location": "Leiden, Netherlands, April 2024",
		"time": "2024",
		"type": "Invited attendee",
		"link": "https://www.lorentzcenter.nl/beating-real-time-crypto-solutions-and-analysis.html",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "FSE 2024",
		"location": "Leuven, Belgium",
		"time": "2024",
		"type": "Paper presentation",
		"link": "https://fse.iacr.org/2024/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "EUROCRYPT 2023",
		"location": "Lyon, France",
		"time": "2024",
		"type": "Paper presentation",
		"link": "https://eurocrypt.iacr.org/2024/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "FSE 2023",
		"location": "Kobe, Japan",
		"time": "2023",
		"type": "Paper presentation",
		"link": "https://fse.iacr.org/2023/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "FSE 2023",
		"location": "Kobe, Japan",
		"time": "2023",
		"type": "Paper presentation",
		"link": "https://fse.iacr.org/2023/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "ACNS 2022",
		"location": "Rome, Italy",
		"time": "2022",
		"type": "Paper presentation",
		"link": "https://acns22.di.uniroma1.it/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "FRISIACRYPT 2022",
		"location": "Netherlands",
		"time": "2022",
		"type": "Invited attendee",
		"link": "https://frisiacrypt2022.cs.ru.nl/",
		"detailsLink": "https://frisiacrypt2022.cs.ru.nl/"
	},
	{
		"title": "CHES 2022",
		"location": "Louven, Belgium",
		"time": "2022",
		"type": "Paper presnetation",
		"link": "https://ches.iacr.org/2022/",
		"detailsLink": "https://github.com/hadipourh/talks"
	},
	{
		"title": "FSE 2022",
		"location": "Atehns, Greece",
		"time": "2022",
		"type": "Paper presentation",
		"link": "https://fse.iacr.org/2022/",
		"detailsLink": "https://github.com/hadipourh/talks"
	}
];

export const reviews = [
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
		"time": "1062",
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
		"time": "1062",
		"link": "https://www.springer.com/journal/10623"
	}
];

export const honors = [
	{
		"title": "Bronze medal, 38th National Mathematical Competition for University Students, Kerman, Iran",
		"description": "Bronze medal, 38th National Mathematical Competition for University Students, Kerman, Iran, May 2014.",
		"time": "2014",
		"link": "http://www.ims.ir",
		"icon": "🥉"
	},
	{
		"title": "Bronze medal, 37th National Mathematical Competition for University Students, Semnan, Iran",
		"description": "Bronze medal, 37th National Mathematical Competition for University Students, Semnan, Iran, May 2013.",
		"time": "2013",
		"link": "http://www.ims.ir",
		"icon": "🥉"
	},
	{
		"title": "Among the winners of NSUCRYPTO-2019",
		"description": "Among the winners of NSUCRYPTO-2019 (October 13-21, 2019).",
		"time": "2019",
		"link": "https://nsucrypto.nsu.ru/archive/2019/total\_results/round/1/section/2/\#data",
		"icon": "🏆"
	}
];

export const conferences = [
	{
		"title": "Fast Software Encryption (FSE) 2025",
		"location": "Rome, March 17-21",
		"time": "2025",
		"role": "attendee"
	},
	{
		"title": "SKCAM 2025",
		"location": "Italy, Rome",
		"time": "2025",
		"role": "invited speaker"
	},
	{
		"title": "Beating Real-Time Crypto: Solutions and Analysis",
		"location": "Netherlands, April 22-26",
		"time": "2024",
		"role": "invited speaker"
	},
	{
		"title": "Fast Software Encryption (FSE) 2024",
		"location": "Belgium, March 25-29",
		"time": "2024",
		"role": "speaker"
	},
	{
		"title": "EUROCRYPT 2023",
		"location": "France, April 23-27",
		"time": "2023",
		"role": "speaker"
	},
	{
		"title": "Fast Software Encryption (FSE) 2023",
		"location": "Japan, March 20-24",
		"time": "2023",
		"role": "speaker"
	},
	{
		"title": "Applied Cryptography and Network Security 2022",
		"location": "Italy, June 20-23",
		"time": "2022",
		"role": "speaker"
	},
	{
		"title": "FRISIACRYPT 2022",
		"location": "Netherlands, September 25-28",
		"time": "2022",
		"role": "invited attendee"
	},
	{
		"title": "Cryptographic Hardware and Embedded Systems 2022",
		"location": "Belgium, September 18-21",
		"time": "2022",
		"role": "speaker"
	},
	{
		"title": "Fast Software Encryption (FSE) 2022",
		"location": "Greece, March 20-25",
		"time": "2022",
		"role": "speaker"
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
