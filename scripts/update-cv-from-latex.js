#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive CV updater that parses CV.tex and updates src/data/cv.ts
 * Handles all sections found in CV.tex while ignoring commented content
 */

function cleanLatexText(text) {
  if (!text) return '';
  
  return text
    // Remove LaTeX commands but keep the content
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textsc\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\url\{([^}]*)\}/g, '$1') // Keep URL content
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1') // Keep link text only
    .replace(/\\LaTeX/g, 'LaTeX') // Convert \LaTeX to LaTeX
    .replace(/\\faTrophy\s*/g, '')
    .replace(/\\faGraduationCap\s*/g, '')
    .replace(/\\faStar\s*/g, '')
    .replace(/\\fa[A-Za-z]+\s*/g, '')
    // Clean up LaTeX artifacts and special characters
    .replace(/‌/g, '') // Remove zero-width non-joiner
    .replace(/\\\\/g, ' ') // Replace double backslashes with space
    .replace(/\\([a-zA-Z]+)/g, '') // Remove remaining LaTeX commands
    .replace(/\{|\}/g, '') // Remove remaining braces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function cleanDescriptionWithUrl(text) {
  if (!text) return '';
  
  // Handle descriptions that contain URLs more elegantly
  return text
    // Remove LaTeX commands but keep the content
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textsc\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    // Format URLs nicely - keep full URL for hyperlinks
    .replace(/\s+\\url\{([^}]*)\}/g, '. More info: $1')
    .replace(/\\url\{([^}]*)\}/g, 'More info: $1')
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1') // Keep link text only
    .replace(/\\LaTeX/g, 'LaTeX') // Convert \LaTeX to LaTeX
    .replace(/\\faTrophy\s*/g, '')
    .replace(/\\faGraduationCap\s*/g, '')
    .replace(/\\faStar\s*/g, '')
    .replace(/\\fa[A-Za-z]+\s*/g, '')
    // Clean up LaTeX artifacts and special characters
    .replace(/‌/g, '') // Remove zero-width non-joiner
    .replace(/\\\\/g, ' ') // Replace double backslashes with space
    .replace(/\\([a-zA-Z]+)/g, '') // Remove remaining LaTeX commands
    .replace(/\{|\}/g, '') // Remove remaining braces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function isCommentedLine(line) {
  return line.trim().startsWith('%');
}

function filterCommentedContent(content) {
  return content
    .split('\n')
    .filter(line => !isCommentedLine(line))
    .join('\n');
}

function extractEducation(latex) {
  console.log('🎓 Extracting education...');
  
  const educationRegex = /\\section\{Education\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(educationRegex);
  
  if (!match) {
    console.log('⚠️ No Education section found');
    return [];
  }
  
  const educationSection = filterCommentedContent(match[1]);
  const education = [];
  
  // Updated regex to handle nested braces
  const entryRegex = /\\cventry\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let entryMatch;
  
  while ((entryMatch = entryRegex.exec(educationSection)) !== null) {
    console.log('Found cventry:', entryMatch[1], entryMatch[2], entryMatch[3]);
    const [, time, degree, institution, city, country, description] = entryMatch;
    
    education.push({
      time: cleanLatexText(time),
      degree: cleanLatexText(degree),
      school: cleanLatexText(institution),
      location: cleanLatexText(`${city}${country ? ', ' + country : ''}`),
      description: cleanLatexText(description)
    });
  }
  
  console.log(`✅ Found ${education.length} education entries`);
  return education;
}

function extractExperience(latex) {
  console.log('💼 Extracting experience...');
  
  const experienceRegex = /\\section\{Experience\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(experienceRegex);
  
  if (!match) {
    console.log('⚠️ No Experience section found');
    return [];
  }
  
  const experienceSection = filterCommentedContent(match[1]);
  const experiences = [];
  
  // Updated regex to handle nested braces
  const entryRegex = /\\cventry\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let entryMatch;
  
  while ((entryMatch = entryRegex.exec(experienceSection)) !== null) {
    const [, time, position, company, location, , description] = entryMatch;
    
    experiences.push({
      time: cleanLatexText(time),
      title: cleanLatexText(position),
      company: cleanLatexText(company),
      location: cleanLatexText(location),
      description: cleanDescriptionWithUrl(description)
    });
  }
  
  console.log(`✅ Found ${experiences.length} experience entries`);
  return experiences;
}

function extractTeaching(latex) {
  console.log('👨‍🏫 Extracting teaching experience...');
  
  const teachingRegex = /\\section\{[^}]*Teaching[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(teachingRegex);
  
  if (!match) {
    console.log('⚠️ No Teaching section found');
    return [];
  }
  
  const teachingSection = filterCommentedContent(match[1]);
  const teaching = [];
  
  // Updated regex to handle nested braces and empty fields
  const entryRegex = /\\cventry\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let entryMatch;
  
  while ((entryMatch = entryRegex.exec(teachingSection)) !== null) {
    const [, year, course, institution, location, extra, description] = entryMatch;
    
    // Parse the description to extract role and institution
    let role = '';
    let inst = '';
    let time = cleanLatexText(year);
    
    if (description) {
      const desc = cleanLatexText(description);
      // Extract role and institution from description like "Guest Lecturer, Graz University of Technology, Summer 2023 and 2024"
      const parts = desc.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        role = parts[0];
        inst = parts[1];
        if (parts.length >= 3) {
          time = parts[2];
        }
      }
    }
    
    teaching.push({
      course: cleanLatexText(course) || 'Unknown Course',
      role: role || 'Instructor',
      institution: inst || cleanLatexText(institution),
      time: time,
      description: cleanLatexText(description)
    });
  }
  
  console.log(`✅ Found ${teaching.length} teaching entries`);
  return teaching;
}

function extractSkills(latex) {
  console.log('📋 Extracting skills...');
  
  const skillsRegex = /\\section\{[^}]*Computer Skills[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(skillsRegex);
  
  if (!match) {
    console.log('⚠️ No Computer Skills section found');
    return [];
  }
  
  const skillsSection = filterCommentedContent(match[1]);
  const skills = [];
  
  // Extract subsections
  const subsectionRegex = /\\subsection\{([^}]+)\}([\s\S]*?)(?=\\subsection|\\section|$)/g;
  let subsectionMatch;
  
  while ((subsectionMatch = subsectionRegex.exec(skillsSection)) !== null) {
    const category = cleanLatexText(subsectionMatch[1]);
    const content = filterCommentedContent(subsectionMatch[2]);
    
    // Extract \cvitem entries
    const itemRegex = /\\cvitem\{([^}]+)\}\{([^}]+)\}/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      const level = cleanLatexText(itemMatch[1]);
      const skillList = cleanLatexText(itemMatch[2]);
      
      if (level && skillList) {
        skills.push({
          category: category,
          level: level,
          skills: skillList
        });
      }
    }
  }
  
  console.log(`✅ Found ${skills.length} skills`);
  return skills;
}

function extractReviews(latex) {
  console.log('📋 Extracting reviews...');
  
  const reviewsRegex = /\\section\{[^}]*Reviews[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(reviewsRegex);
  
  if (!match) {
    console.log('⚠️ No Reviews section found');
    return [];
  }
  
  const reviewsSection = filterCommentedContent(match[1]);
  const reviews = [];
  
  // Extract \item entries from itemize environment
  const lines = reviewsSection.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('\\item ')) {
      // Parse format: \item Role for \href{url}{venue}
      // or: \item Role at \href{url}{venue}
      
      let role = '';
      let venue = '';
      let link = '';
      let year = '';
      
      // Extract URL and venue name
      const hrefMatch = line.match(/\\href\{([^}]*)\}\{([^}]+)\}/);
      if (hrefMatch) {
        link = hrefMatch[1];
        venue = cleanLatexText(hrefMatch[2]);
      }
      
      // Extract role (everything before "for" or "at")
      const roleMatch = line.match(/\\item\s+([^\\]+?)(?:\s+(?:for|at)\s+\\href)/);
      if (roleMatch) {
        role = cleanLatexText(roleMatch[1]);
      }
      
      // Extract year
      const yearMatch = line.match(/(\d{4})/);
      if (yearMatch) {
        year = yearMatch[1];
      }
      
      if (role && venue) {
        reviews.push({
          title: role,
          venue: venue,
          time: year,
          link: link
        });
      } else {
        // Fallback for other formats
        const cleaned = cleanLatexText(line.replace(/\\item\s*/, ''));
        if (cleaned) {
          reviews.push({
            title: 'Review Activity',
            venue: cleaned,
            time: year || 'Unknown',
            link: link
          });
        }
      }
    }
  }
  
  console.log(`✅ Found ${reviews.length} reviews`);
  return reviews;
}

function extractHonors(latex) {
  console.log('🏆 Extracting honors and awards...');
  
  const honorsRegex = /\\section\{[^}]*Honors[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(honorsRegex);
  
  if (!match) {
    console.log('⚠️ No Honors section found');
    return [];
  }
  
  const honorsSection = filterCommentedContent(match[1]);
  const honors = [];
  
  // Split by lines and look for \cvlistitem
  const lines = honorsSection.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('\\cvlistitem{')) {
      // Extract content between braces, handling nested braces
      let braceCount = 0;
      let start = line.indexOf('{') + 1;
      let content = '';
      
      for (let i = start; i < line.length; i++) {
        if (line[i] === '{') braceCount++;
        else if (line[i] === '}') {
          if (braceCount === 0) break;
          braceCount--;
        }
        content += line[i];
      }
      
      if (content.trim()) {
        // Extract URL if present
        let link = '';
        const urlMatch = content.match(/\\url\{([^}]*)\}/);
        if (urlMatch) {
          link = urlMatch[1];
        }
        
        // Extract clean title (remove LaTeX commands and URLs)
        let title = content
          .replace(/\\url\{[^}]*\}/g, '') // Remove URL
          .replace(/\\textbf\{([^}]*)\}/g, '$1') // Extract bold text
          .replace(/\\fa[A-Za-z]+\s*/g, '') // Remove FontAwesome icons
          .trim();
        
        // Extract year from title
        const yearMatch = title.match(/(\d{4})/);
        const year = yearMatch ? yearMatch[1] : "Unknown";
        
        // Clean title further - remove year and extra punctuation
        title = title.replace(/,?\s*\w+,?\s*\d{4}\.?\s*$/, ''); // Remove location and date
        title = title.replace(/\(\w+\s+\d+-\d+,\s+\d{4}\)\.?\s*$/, ''); // Remove date ranges in parentheses
        title = title.replace(/‌/g, ''); // Remove zero-width non-joiner
        title = title.trim().replace(/[,.]$/, ''); // Remove trailing punctuation
        
        if (title) {
          // Determine appropriate icon based on the title
          let icon = '';
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('medal') || lowerTitle.includes('competition')) {
            icon = '🥉'; // Bronze medal for mathematical competitions
          } else if (lowerTitle.includes('winner') || lowerTitle.includes('crypto')) {
            icon = '🏆'; // Trophy for cryptography achievements
          } else if (lowerTitle.includes('award') || lowerTitle.includes('prize')) {
            icon = '🏅'; // General award medal
          } else if (lowerTitle.includes('scholarship') || lowerTitle.includes('grant')) {
            icon = '💰'; // Money for financial awards
          } else {
            icon = '⭐'; // Default star for achievements
          }

          honors.push({
            title: title,
            description: cleanLatexText(content.replace(/\\url\{[^}]*\}/g, '')),
            time: year,
            link: link || '',
            icon: icon
          });
        }
      }
    }
  }
  
  console.log(`✅ Found ${honors.length} honors`);
  return honors;
}

function extractInterests(latex) {
  console.log('📋 Extracting interests...');
  
  // Look for Other Information section with Interests subsection
  const otherInfoRegex = /\\section\{[^}]*Other Information[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(otherInfoRegex);
  
  if (!match) {
    console.log('⚠️ No Other Information section found');
    return [];
  }
  
  const otherInfoSection = filterCommentedContent(match[1]);
  const interests = [];
  
  // Look for Interests subsection
  const interestsMatch = otherInfoSection.match(/\\subsection\{[^}]*Interests[^}]*\}([\s\S]*?)(?=\\subsection|\\section|$)/i);
  
  if (interestsMatch) {
    const interestsSection = filterCommentedContent(interestsMatch[1]);
    
    // Extract \cvlistdoubleitem entries (format: \cvlistdoubleitem{item1}{item2})
    const doubleItemRegex = /\\cvlistdoubleitem\{([^}]+)\}\{([^}]+)\}/g;
    let doubleMatch;
    
    while ((doubleMatch = doubleItemRegex.exec(interestsSection)) !== null) {
      const interest1 = cleanLatexText(doubleMatch[1]);
      const interest2 = cleanLatexText(doubleMatch[2]);
      
      if (interest1) {
        interests.push({
          title: interest1,
          description: getInterestDescription(interest1),
          icon: getInterestIcon(interest1)
        });
      }
      if (interest2) {
        interests.push({
          title: interest2,
          description: getInterestDescription(interest2),
          icon: getInterestIcon(interest2)
        });
      }
    }
    
    // Also extract regular \cvlistitem entries
    const itemRegex = /\\cvlistitem\{([^}]+)\}/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(interestsSection)) !== null) {
      const interest = cleanLatexText(itemMatch[1]);
      if (interest) {
        interests.push({
          title: interest,
          description: getInterestDescription(interest),
          icon: getInterestIcon(interest)
        });
      }
    }
  }
  
  console.log(`✅ Found ${interests.length} interests`);
  return interests;
}

function getInterestIcon(interest) {
  const lowercaseInterest = interest.toLowerCase();
  
  if (lowercaseInterest.includes('swimming')) return '🏊‍♂️';
  if (lowercaseInterest.includes('tennis')) return '🎾';
  if (lowercaseInterest.includes('hiking') || lowercaseInterest.includes('mountain')) return '🏔️';
  if (lowercaseInterest.includes('biking') || lowercaseInterest.includes('cycling')) return '🚴‍♂️';
  if (lowercaseInterest.includes('traveling') || lowercaseInterest.includes('travel')) return '✈️';
  if (lowercaseInterest.includes('movies') || lowercaseInterest.includes('film')) return '🎬';
  if (lowercaseInterest.includes('reading') || lowercaseInterest.includes('books')) return '📚';
  if (lowercaseInterest.includes('programming') || lowercaseInterest.includes('coding')) return '💻';
  if (lowercaseInterest.includes('music') || lowercaseInterest.includes('guitar') || lowercaseInterest.includes('piano')) return '🎵';
  if (lowercaseInterest.includes('puzzle') || lowercaseInterest.includes('chess')) return '♟️';
  
  return '🎯'; // Default icon
}

function getInterestDescription(interest) {
  const lowercaseInterest = interest.toLowerCase();
  
  if (lowercaseInterest.includes('swimming')) return 'Regular swimming for fitness and relaxation';
  if (lowercaseInterest.includes('tennis')) return 'Playing tennis for recreation and sport';
  if (lowercaseInterest.includes('hiking') || lowercaseInterest.includes('mountain')) return 'Outdoor adventures and nature exploration';
  if (lowercaseInterest.includes('biking') || lowercaseInterest.includes('cycling')) return 'Cycling for fitness and exploration';
  if (lowercaseInterest.includes('traveling') || lowercaseInterest.includes('travel')) return 'Exploring new cultures and destinations';
  if (lowercaseInterest.includes('movies') || lowercaseInterest.includes('film') || lowercaseInterest.includes('documentary')) return 'Watching films and educational content';
  if (lowercaseInterest.includes('reading') || lowercaseInterest.includes('books')) return 'Reading literature and academic materials';
  if (lowercaseInterest.includes('programming') || lowercaseInterest.includes('coding')) return 'Software development and technical projects';
  if (lowercaseInterest.includes('music') || lowercaseInterest.includes('guitar') || lowercaseInterest.includes('piano')) return 'Playing musical instruments and composition';
  if (lowercaseInterest.includes('puzzle') || lowercaseInterest.includes('chess')) return 'Strategic games and mental challenges';
  
  return 'Personal hobby and interest';
}

function extractPresentations(latex) {
  console.log('🎤 Extracting visits and presentations...');
  
  const presentationsRegex = /\\section\{[^}]*Visits and Presentations[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(presentationsRegex);
  
  if (!match) {
    console.log('⚠️ No Visits and Presentations section found');
    return [];
  }
  
  const presentationsSection = filterCommentedContent(match[1]);
  const presentations = [];
  
  // Extract \item entries from itemize environment
  const lines = presentationsSection.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('\\item ')) {
      // Parse the complex format: \item \textbf{\href{url}{title} - location, date}: \href{url}{description}
      
      // Extract event name and location/date
      const eventMatch = line.match(/\\textbf\{\\href\{([^}]*)\}\{([^}]+)\}[^:}]*- ([^:}]+)\}/);
      let eventUrl = '';
      let eventName = '';
      let location = '';
      
      if (eventMatch) {
        eventUrl = eventMatch[1];
        eventName = eventMatch[2];
        location = eventMatch[3];
      }
      
      // Extract description and link
      const descMatch = line.match(/:\s*\\href\{([^}]*)\}\{([^}]+)\}/);
      let descUrl = '';
      let description = '';
      
      if (descMatch) {
        descUrl = descMatch[1];
        description = descMatch[2];
      }
      
      // Extract year
      const yearMatch = line.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : '';
      
      if (eventName) {
        presentations.push({
          title: cleanLatexText(eventName),
          location: cleanLatexText(location),
          time: year,
          type: cleanLatexText(description),
          link: eventUrl,
          detailsLink: descUrl
        });
      }
    }
  }
  
  console.log(`✅ Found ${presentations.length} presentations`);
  return presentations;
}

function extractLanguages(latex) {
  console.log('🌍 Extracting languages...');
  
  const languagesRegex = /\\section\{[^}]*Languages[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(languagesRegex);
  
  if (!match) {
    console.log('⚠️ No Languages section found');
    return [];
  }
  
  const languagesSection = filterCommentedContent(match[1]);
  const languages = [];
  
  // Extract \cvitemwithcomment entries
  const itemRegex = /\\cvitemwithcomment\{([^}]+)\}\{([^}]+)\}\{[^}]*\}/g;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(languagesSection)) !== null) {
    const language = cleanLatexText(itemMatch[1]);
    const level = cleanLatexText(itemMatch[2]);
    
    if (language && level) {
      let proficiency = 1; // Default to lowest proficiency
      let color = 'text-gray-600';
      let icon = '🌍';
      
      switch (level.toLowerCase()) {
        case 'mother tongue':
        case 'native':
          proficiency = 5;
          color = 'text-green-600';
          icon = '🏠';
          break;
        case 'advanced':
        case 'fluent':
          proficiency = 4;
          color = 'text-blue-600';
          icon = '🌍';
          break;
        case 'intermediate':
          proficiency = 3;
          color = 'text-yellow-600';
          icon = '📚';
          break;
        case 'basic':
          proficiency = 2;
          color = 'text-orange-600';
          icon = '🔰';
          break;
        case 'learning':
        case 'beginner':
          proficiency = 1;
          color = 'text-purple-600';
          icon = '🌱';
          break;
        default:
          // Log unmatched levels for debugging
          console.log(`⚠️ Unmatched language level: "${level}" for ${language}`);
          proficiency = 1;
          break;
      }
      
      languages.push({
        language,
        level,
        proficiency,
        color,
        icon
      });
    }
  }
  
  console.log(`✅ Found ${languages.length} languages`);
  return languages;
}

function extractMemberships(latex) {
  console.log('👥 Extracting memberships...');
  
  // Look for Other Information section with Memberships subsection
  const otherInfoRegex = /\\section\{[^}]*Other Information[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(otherInfoRegex);
  
  if (!match) {
    console.log('⚠️ No Other Information section found');
    return [];
  }
  
  const otherInfoSection = filterCommentedContent(match[1]);
  const memberships = [];
  
  // Look for Memberships subsection
  const membershipsMatch = otherInfoSection.match(/\\subsection\{[^}]*Memberships[^}]*\}([\s\S]*?)(?=\\subsection|\\section|$)/i);
  
  if (membershipsMatch) {
    const membershipsSection = filterCommentedContent(membershipsMatch[1]);
    
    // Extract \cvitem entries (format: \cvitem{time}{organization})
    const itemRegex = /\\cvitem\{([^}]+)\}\{([^}]+)\}/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(membershipsSection)) !== null) {
      const [, time, organization] = itemMatch;
      const cleanTime = cleanLatexText(time);
      const cleanOrg = cleanLatexText(organization);
      
      if (cleanOrg) {
        memberships.push({
          title: cleanOrg,
          description: `Member since ${cleanTime}`,
          time: cleanTime
        });
      }
    }
  }
  
  console.log(`✅ Found ${memberships.length} memberships`);
  return memberships;
}

function updateCvData(education, experiences, teaching, skills, reviews, honors, interests, languages, presentations, memberships) {
  const cvPath = path.join(__dirname, '..', 'src', 'data', 'cv.ts');
  
  // Read current cv.ts file
  let cvContent = fs.readFileSync(cvPath, 'utf8');
  
  // Update education section
  const educationData = education.map(edu => 
    `\t{\n\t\t"time": "${edu.time}",\n\t\t"degree": "${edu.degree ? edu.degree.replace(/"/g, '\\"') : ''}",\n\t\t"school": "${edu.school ? edu.school.replace(/"/g, '\\"') : ''}",\n\t\t"location": "${edu.location || ''}",\n\t\t"description": "${edu.description ? edu.description.replace(/"/g, '\\"') : ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const education = \[[\s\S]*?\];/,
    `export const education = [\n${educationData}\n];`
  );
  
  // Update experiences section
  const experienceData = experiences.map(exp => 
    `\t{\n\t\t"time": "${exp.time}",\n\t\t"title": "${exp.title ? exp.title.replace(/"/g, '\\"') : ''}",\n\t\t"company": "${exp.company ? exp.company.replace(/"/g, '\\"') : ''}",\n\t\t"location": "${exp.location || ''}",\n\t\t"description": "${exp.description ? exp.description.replace(/"/g, '\\"') : ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const experiences = \[[\s\S]*?\];/,
    `export const experiences = [\n${experienceData}\n];`
  );
  
  // Update teaching section
  const teachingData = teaching.map(teach => 
    `\t{\n\t\t"course": "${teach.course ? teach.course.replace(/"/g, '\\"') : ''}",\n\t\t"role": "${teach.role ? teach.role.replace(/"/g, '\\"') : ''}",\n\t\t"institution": "${teach.institution ? teach.institution.replace(/"/g, '\\"') : ''}",\n\t\t"time": "${teach.time || ''}",\n\t\t"description": "${teach.description ? teach.description.replace(/"/g, '\\"') : ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const teaching = \[[\s\S]*?\];/,
    `export const teaching = [\n${teachingData}\n];`
  );
  
  // Update skills section - create proper hierarchical structure
  const skillsData = skills.map(skill => 
    `\t{\n\t\t"category": "${skill.category.replace(/"/g, '\\"')}",\n\t\t"level": "${skill.level.replace(/"/g, '\\"')}",\n\t\t"skills": "${skill.skills.replace(/"/g, '\\"')}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const skills = \[[\s\S]*?\];/,
    `export const skills = [\n${skillsData}\n];`
  );
  
  // Update reviews section
  const reviewsData = reviews.map(review => 
    `\t{\n\t\t"title": "${review.title ? review.title.replace(/"/g, '\\"') : ''}",\n\t\t"venue": "${review.venue ? review.venue.replace(/"/g, '\\"') : ''}",\n\t\t"time": "${review.time || ''}",\n\t\t"link": "${review.link || ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const reviews = \[[\s\S]*?\];/,
    `export const reviews = [\n${reviewsData}\n];`
  );
  
  // Update honors section
  const honorsData = honors.map(honor => 
    `\t{\n\t\t"title": "${honor.title.replace(/"/g, '\\"')}",\n\t\t"description": "${honor.description ? honor.description.replace(/"/g, '\\"') : ''}",\n\t\t"time": "${honor.time || ''}",\n\t\t"link": "${honor.link || ''}",\n\t\t"icon": "${honor.icon || '⭐'}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const honors = \[[\s\S]*?\];/,
    `export const honors = [\n${honorsData}\n];`
  );
  
  // Update interests section
  const interestsData = interests.map(interest => 
    `\t{\n\t\t"title": "${interest.title ? interest.title.replace(/"/g, '\\"') : ''}",\n\t\t"description": "${interest.description ? interest.description.replace(/"/g, '\\"') : ''}",\n\t\t"icon": "${interest.icon || ''}"\n\t}`
  ).join(',\n');
  cvContent = cvContent.replace(
    /export const interests = \[[\s\S]*?\];/,
    `export const interests = [\n${interestsData}\n];`
  );
  
  // Update languages section
  const languagesData = languages.map(lang => 
    `\t{\n\t\tlanguage: "${lang.language}",\n\t\tlevel: "${lang.level}",\n\t\tproficiency: ${lang.proficiency},\n\t\tcolor: "${lang.color}",\n\t\ticon: "${lang.icon}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const languages: .*?\[\] = \[[\s\S]*?\];/,
    `export const languages: { language: string; level: string; proficiency: number; color: string; icon: string }[] = [\n${languagesData}\n];`
  );
  
  // Update presentations section
  const presentationsData = presentations.map(pres => 
    `\t{\n\t\t"title": "${pres.title ? pres.title.replace(/"/g, '\\"') : ''}",\n\t\t"location": "${pres.location ? pres.location.replace(/"/g, '\\"') : ''}",\n\t\t"time": "${pres.time || ''}",\n\t\t"type": "${pres.type ? pres.type.replace(/"/g, '\\"') : ''}",\n\t\t"link": "${pres.link || ''}",\n\t\t"detailsLink": "${pres.detailsLink || ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const presentations = \[[\s\S]*?\];/,
    `export const presentations = [\n${presentationsData}\n];`
  );
  
  // Update memberships section
  const membershipsData = memberships.map(member => 
    `\t{\n\t\t"title": "${member.title.replace(/"/g, '\\"')}",\n\t\t"description": "${member.description.replace(/"/g, '\\"')}",\n\t\t"time": "${member.time}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const memberships = \[[\s\S]*?\];/,
    `export const memberships = [\n${membershipsData}\n];`
  );
  
  // Write updated content
  fs.writeFileSync(cvPath, cvContent);
  console.log('✅ CV data updated successfully!');
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive CV update from LaTeX...');
    
    // Read CV.tex directly
    const cvPath = path.join(__dirname, '..', 'public', 'cv', 'CV.tex');
    
    if (!fs.existsSync(cvPath)) {
      console.error('❌ CV.tex not found at:', cvPath);
      process.exit(1);
    }
    
    const latexContent = fs.readFileSync(cvPath, 'utf8');
    console.log('📄 CV.tex loaded successfully');
    
    // Extract all sections (ignoring commented content)
    const education = extractEducation(latexContent);
    const experiences = extractExperience(latexContent);
    const teaching = extractTeaching(latexContent);
    const skills = extractSkills(latexContent);
    const reviews = extractReviews(latexContent);
    const honors = extractHonors(latexContent);
    const interests = extractInterests(latexContent);
    const languages = extractLanguages(latexContent);
    const presentations = extractPresentations(latexContent);
    const memberships = extractMemberships(latexContent);
    
    // Update cv.ts file
    updateCvData(education, experiences, teaching, skills, reviews, honors, interests, languages, presentations, memberships);
    
    console.log('🎉 CV update completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Education: ${education.length} entries`);
    console.log(`   Experience: ${experiences.length} entries`);
    console.log(`   Teaching: ${teaching.length} entries`);
    console.log(`   Skills: ${skills.length} entries`);
    console.log(`   Reviews: ${reviews.length} entries`);
    console.log(`   Honors: ${honors.length} entries`);
    console.log(`   Interests: ${interests.length} entries`);
    console.log(`   Languages: ${languages.length} entries`);
    console.log(`   Presentations: ${presentations.length} entries`);
    console.log(`   Memberships: ${memberships.length} entries`);
    
  } catch (error) {
    console.error('❌ Error updating CV:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
