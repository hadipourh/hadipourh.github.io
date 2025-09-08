/**
 * Configuration for CV PDF parsing
 * Customize these patterns based on your CV format
 */

export const CV_PARSING_CONFIG = {
  // Section headers to look for (case insensitive)
  sectionHeaders: {
    experience: ['experience', 'employment', 'work experience', 'professional experience'],
    education: ['education', 'academic background'],
    skills: ['skills', 'technical skills', 'competencies'],
    teaching: ['teaching', 'teaching experience', 'instruction'],
    presentations: ['presentations', 'talks', 'invited talks', 'conference presentations'],
    reviews: ['reviews', 'reviewer', 'review activities', 'peer review'],
    honors: ['honors', 'awards', 'achievements', 'distinctions'],
    conferences: ['conferences', 'conference attendance', 'workshops'],
    memberships: ['memberships', 'professional memberships', 'affiliations'],
    interests: ['interests', 'personal interests', 'hobbies']
  },

  // Patterns for extracting structured data
  patterns: {
    // Date patterns: 2020-2024, 2020-Present, Fall 2020, etc.
    dateRange: /(\d{4})\s*[-–]\s*(\d{4}|present|current|now)/gi,
    singleDate: /\b(\d{4})\b/g,
    
    // Organization patterns
    university: /(university|institute|college)/i,
    company: /(gmbh|inc|ltd|corp|university|institute)/i,
    
    // Publication venues
    venues: /(crypto|eurocrypt|fse|ches|tosc|acns|asiacrypt)/i,
    
    // Common separators
    separators: [' | ', ' • ', ' - ', ', ', ' at '],
    
    // Teaching keywords
    teachingKeywords: ['lecturer', 'assistant', 'instructor', 'professor', 'teaching'],
    
    // Review keywords
    reviewKeywords: ['reviewer', 'subreviewer', 'pc member', 'program committee'],
    
    // Honor keywords
    honorKeywords: ['award', 'prize', 'scholarship', 'fellowship', 'distinction', 'honor']
  },

  // Stop words for better text processing
  stopSections: [
    'references', 'publications', 'bibliography', 'contact', 'personal information'
  ],

  // Minimum text length for valid entries
  minEntryLength: 10,
  
  // Maximum description length
  maxDescriptionLength: 500
};

export default CV_PARSING_CONFIG;
