export interface Experience {
  company: string;
  time: string;
  title: string;
  location?: string;
  description?: string;
}

export interface Education {
  school: string;
  time: string;
  degree: string;
  location?: string;
  description?: string;
}

export interface Skill {
  category: string;
  level: string;
  skills: string;
}

export interface Publication {
  title: string;
  authors: string;
  venue: string;  // Venue name (was 'journal')
  year: number;   // Year as number (was 'time' as string)
  url?: string;   // Primary URL (was 'link')
  doi?: string;   // DOI identifier
  type?: string;  // Publication type: conference, journal, hybrid, workshop, preprint
  prestigeScore?: number; // Venue prestige score (0-100)
  // Legacy fields for backward compatibility
  journal?: string;  // Alias for venue
  time?: string;     // Alias for year
  link?: string;     // Alias for url
  abstract?: string;
}

export interface Teaching {
  course: string;
  role: string;
  institution: string;
  time: string;
  description?: string;
}

export interface Honor {
  title: string;
  description: string;
  time: string;
  icon?: string;
  link?: string;
}

export interface Presentation {
  title: string;
  location: string;
  time: string;
  type: string;
}

export function isExperience(element: Experience | Education): element is Experience {
  return 'title' in element && 'company' in element;
}

export function isEducation(element: Education | Experience): element is Education {
  return 'school' in element && 'degree' in element;
}

export function isSkill(element: Skill | Publication): element is Skill {
  return 'description' in element;
}

export function isPublication(element: Skill | Publication): element is Publication {
  return 'authors' in element;
}
