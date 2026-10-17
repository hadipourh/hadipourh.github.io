/**
 * Types for src/data/cv.ts, which scripts/update-cv-from-latex.js generates
 * from public/cv/CV.tex. Fields ending in `Html` hold escaped HTML rendered
 * from LaTeX (links, bold, italics); render them with set:html.
 */

export type CvSectionKey =
  | 'appointments'
  | 'education'
  | 'publications'
  | 'teaching'
  | 'service'
  | 'visits'
  | 'honors'
  | 'skills'
  | 'researchInterests'
  | 'talks'
  | 'languages'
  | 'memberships'
  | 'interests';

/** A CV section in CV.tex order, titled as in CV.tex. */
export interface CvSection {
  key: CvSectionKey;
  title: string;
}

/** A Research Appointments or Education entry, shown on the timeline. */
export interface TimelineEntry {
  time: string;
  title: string;
  organization: string;
  location: string;
  descriptionHtml: string;
  detailsHtml: string[];
}

export interface TeachingEntry {
  time: string;
  role: string;
  institution: string;
  location: string;
  /** Set when CV.tex describes the entry as "Course: <name>." */
  course: string | null;
  descriptionHtml: string;
}

export interface SupervisionEntry {
  label: string;
  descriptionHtml: string;
}

export interface ServiceEntry {
  role: string;
  /** The role is bold in CV.tex, e.g. a chair position. */
  highlight: boolean;
  venue: string;
  url: string;
}

/** A visit or a talk. */
export interface EventEntry {
  time: string;
  title: string;
  url: string;
  detailsHtml: string;
  noteHtml: string;
}

export interface Honor {
  time: string;
  distinction: string;
  event: string;
  location: string;
  date: string;
  detailsHtml: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Language {
  language: string;
  level: string;
  /** 1 (learning) to 5 (mother tongue). */
  proficiency: number;
}

export interface Membership {
  time: string;
  organization: string;
}

export interface Interest {
  title: string;
  description: string;
  /** An IconRenderer icon name. */
  icon: string;
}

/** An entry of src/data/publications.json (generated from DBLP). */
export interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  doi: string;
  type: 'journal' | 'conference' | 'hybrid' | 'workshop' | 'preprint' | 'article';
  prestigeScore: number;
  citations: number;
}
