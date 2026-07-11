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
    .replace(/\\href\{([^{}]*)\}\{([^{}]*)\}/g, '$2')
    .replace(/\\url\{([^{}]*)\}/g, '$1')
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textsc\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\LaTeX/g, 'LaTeX')
    .replace(/\\sim/g, ' through ')
    .replace(/\\faTrophy\s*/g, '')
    .replace(/\\faGraduationCap\s*/g, '')
    .replace(/\\faStar\s*/g, '')
    .replace(/\\fa[A-Za-z]+\s*/g, '')
    .replace(/^\d+(?:cm|mm|in|pt)\s+/g, '')
    .replace(/‌/g, '')
    .replace(/\\\\/g, ' ')
    .replace(/\\([#$%&_])/g, '$1')
    .replace(/\\([a-zA-Z]+)/g, '')
    .replace(/\{|\}/g, '')
    .replace(/[$^]/g, '')
    .replace(/~/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDescriptionWithUrl(text) {
  if (!text) return '';
  
  return text
    .replace(/\\href\{([^{}]*)\}\{([^{}]*)\}/g, '$2 (More info: $1)')
    .replace(/\s+\\url\{([^{}]*)\}/g, '. More info: $1')
    .replace(/\\url\{([^{}]*)\}/g, 'More info: $1')
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textsc\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\LaTeX/g, 'LaTeX')
    .replace(/\\faTrophy\s*/g, '')
    .replace(/\\faGraduationCap\s*/g, '')
    .replace(/\\faStar\s*/g, '')
    .replace(/\\fa[A-Za-z]+\s*/g, '')
    .replace(/^\d+(?:cm|mm|in|pt)\s+/g, '')
    .replace(/‌/g, '')
    .replace(/\\\\/g, ' ')
    .replace(/\\([#$%&_])/g, '$1')
    .replace(/\\([a-zA-Z]+)/g, '')
    .replace(/\{|\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readDelimitedArgument(text, start, open, close) {
  if (text[start] !== open) return null;

  let depth = 0;
  for (let index = start; index < text.length; index++) {
    if (text[index] === open) depth++;
    if (text[index] === close) {
      depth--;
      if (depth === 0) {
        return { value: text.slice(start + 1, index), end: index + 1 };
      }
    }
  }

  return null;
}

function extractCommandEntries(content, command, argumentCount) {
  const entries = [];
  const token = `\\${command}`;
  let searchIndex = 0;

  while (searchIndex < content.length) {
    const commandIndex = content.indexOf(token, searchIndex);
    if (commandIndex === -1) break;

    let cursor = commandIndex + token.length;
    if (/[A-Za-z@]/.test(content[cursor] || '')) {
      searchIndex = cursor;
      continue;
    }

    while (/\s/.test(content[cursor] || '')) cursor++;
    if (content[cursor] === '[') {
      const optionalArgument = readDelimitedArgument(content, cursor, '[', ']');
      if (!optionalArgument) {
        searchIndex = cursor + 1;
        continue;
      }
      cursor = optionalArgument.end;
    }

    const args = [];
    while (args.length < argumentCount) {
      while (/\s/.test(content[cursor] || '')) cursor++;
      const argument = readDelimitedArgument(content, cursor, '{', '}');
      if (!argument) break;
      args.push(argument.value);
      cursor = argument.end;
    }

    if (args.length === argumentCount) {
      entries.push({ command, args, index: commandIndex });
    }
    searchIndex = Math.max(cursor, commandIndex + token.length);
  }

  return entries;
}

function extractEntriesForCommands(content, commands, argumentCount) {
  return commands
    .flatMap(command => extractCommandEntries(content, command, argumentCount))
    .sort((left, right) => left.index - right.index);
}

function cleanLatexUrl(url) {
  return url
    .replace(/\\([#$%&_])/g, '$1')
    .replace(/\s+/g, '')
    .trim();
}

function extractHrefEntries(text) {
  return extractCommandEntries(text, 'href', 2).map(({ args }) => ({
    url: cleanLatexUrl(args[0]),
    label: cleanLatexText(args[1])
  }));
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
  console.log('Extracting education...');
  
  const educationRegex = /\\section\{Education\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(educationRegex);
  
  if (!match) {
    console.log('WARNING: No Education section found');
    return [];
  }
  
  const educationSection = filterCommentedContent(match[1]);
  const education = [];
  const entries = extractCommandEntries(educationSection, 'cventry', 6);

  for (const { args: [time, degree, institution, city, country, description] } of entries) {
    
    education.push({
      time: cleanLatexText(time),
      degree: cleanLatexText(degree),
      school: cleanLatexText(institution),
      location: cleanLatexText(`${city}${country ? ', ' + country : ''}`),
      description: cleanLatexText(description)
    });
  }
  
  console.log(`SUCCESS: Found ${education.length} education entries`);
  return education;
}

function extractExperience(latex) {
  console.log('Extracting experience...');
  
  const experienceRegex = /\\section\{Experience\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(experienceRegex);
  
  if (!match) {
    console.log('WARNING: No Experience section found');
    return [];
  }
  
  const experienceSection = filterCommentedContent(match[1]);
  const experiences = [];
  const entries = extractEntriesForCommands(experienceSection, ['experienceentry', 'cventry'], 6);

  for (const { args: [time, position, company, city, country, description] } of entries) {
    
    experiences.push({
      time: cleanLatexText(time),
      title: cleanLatexText(position),
      company: cleanLatexText(company),
      location: cleanLatexText(`${city}${country ? ', ' + country : ''}`),
      description: cleanDescriptionWithUrl(description)
    });
  }
  
  console.log(`SUCCESS: Found ${experiences.length} experience entries`);
  return experiences;
}

function extractTeaching(latex) {
  console.log('Extracting teaching experience...');
  
  const teachingRegex = /\\section\{[^}]*Teaching[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(teachingRegex);
  
  if (!match) {
    console.log('WARNING: No Teaching section found');
    return [];
  }
  
  const teachingSection = filterCommentedContent(match[1]);
  const teaching = [];
  const entries = extractEntriesForCommands(teachingSection, ['experienceentry', 'cventry'], 6);

  for (const { command, args: [year, field, institution, , , description] } of entries) {
    const cleanedDescription = cleanDescriptionWithUrl(description);
    const courseMatch = cleanedDescription.match(/^Course:\s*(.*?)(?:\.?\s*)$/i);
    const descriptionParts = cleanedDescription.split(',').map(part => part.trim());
    const isExperienceEntry = command === 'experienceentry';
    const role = isExperienceEntry ? cleanLatexText(field) : descriptionParts[0] || 'Instructor';
    const inst = isExperienceEntry ? cleanLatexText(institution) : descriptionParts[1] || cleanLatexText(institution);
    const time = isExperienceEntry ? cleanLatexText(year) : descriptionParts[2] || cleanLatexText(year);
    const course = isExperienceEntry
      ? cleanLatexText(courseMatch?.[1] || cleanedDescription.replace(/^Course:\s*/i, ''))
      : cleanLatexText(field);
    
    teaching.push({
      course: course || 'Unknown Course',
      role: role || 'Instructor',
      institution: inst,
      time: time,
      description: cleanedDescription
    });
  }
  
  console.log(`SUCCESS: Found ${teaching.length} teaching entries`);
  return teaching;
}

function extractSkills(latex) {
  console.log('Extracting skills...');
  
  const skillsRegex = /\\section\{[^}]*Computer Skills[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(skillsRegex);
  
  if (!match) {
    console.log('WARNING: No Computer Skills section found');
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
    
    const entries = extractEntriesForCommands(content, ['detailitem', 'skillitem', 'cvitem'], 2);
    
    for (const { args: [levelArgument, skillsArgument] } of entries) {
      const level = cleanLatexText(levelArgument);
      const skillList = cleanLatexText(skillsArgument);
      
      if (level && skillList) {
        skills.push({
          category: category,
          level: level,
          skills: skillList
        });
      }
    }
  }
  
  console.log(`SUCCESS: Found ${skills.length} skills`);
  return skills;
}

function extractReviews(latex) {
  console.log('Extracting reviews...');
  
  const reviewsRegex = /\\section\{[^}]*Reviews[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(reviewsRegex);
  
  if (!match) {
    console.log('WARNING: No Reviews section found');
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
      
      // Only evaluate the rendered content, not a four-digit sequence in a URL.
      const yearMatch = cleanLatexText(line).match(/\b(?:19|20)\d{2}\b/);
      if (yearMatch) {
        year = yearMatch[0];
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
  
  console.log(`SUCCESS: Found ${reviews.length} reviews`);
  return reviews;
}

function extractHonors(latex) {
  console.log('Extracting honors and awards...');
  
  const honorsRegex = /\\section\{[^}]*Honors[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(honorsRegex);
  
  if (!match) {
    console.log('WARNING: No Honors section found');
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
          honors.push({
            title: title,
            description: cleanLatexText(content.replace(/\\url\{[^}]*\}/g, '')),
            time: year,
            link: link || '',
            icon: getHonorIcon(title)
          });
        }
      }
    }
  }

  const entries = extractCommandEntries(honorsSection, 'cventry', 6);
  for (const { args: [time, distinction, event, location, date, details] } of entries) {
    const title = cleanLatexText(`${distinction}: ${event}`);
    const description = [location, date, details]
      .map(cleanLatexText)
      .filter(Boolean)
      .join(', ');
    const link = extractHrefEntries(details)[0]?.url || '';

    if (title) {
      honors.push({
        title,
        description,
        time: cleanLatexText(time),
        link,
        icon: getHonorIcon(title)
      });
    }
  }
  
  console.log(`SUCCESS: Found ${honors.length} honors`);
  return honors;
}

function getHonorIcon(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('medal') || lowerTitle.includes('competition')) return '🥉';
  if (lowerTitle.includes('winner') || lowerTitle.includes('crypto')) return '🏆';
  if (lowerTitle.includes('award') || lowerTitle.includes('prize')) return '🏅';
  if (lowerTitle.includes('scholarship') || lowerTitle.includes('grant')) return '💰';
  return '⭐';
}

function extractInterests(latex) {
  console.log('Extracting interests...');
  
  // Look for Other Information section with Interests subsection
  const otherInfoRegex = /\\section\{[^}]*Other Information[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(otherInfoRegex);
  
  if (!match) {
    console.log('WARNING: No Other Information section found');
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
  
  console.log(`SUCCESS: Found ${interests.length} interests`);
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
  console.log('Extracting visits and presentations...');
  
  const presentations = extractCvItemEvents(
    latex,
    title => /^Visits(?: and Presentations)?$/i.test(title)
  );
  
  console.log(`SUCCESS: Found ${presentations.length} presentations`);
  return presentations;
}

function extractConferences(latex) {
  console.log('Extracting conference attendance...');

  const conferences = extractCvItemEvents(
    latex,
    title => /^Attended Seminars\/Conferences\/Workshops$/i.test(title)
  ).map(event => ({
    title: event.title,
    location: event.location,
    time: event.time,
    role: event.type || 'Attendee'
  }));

  console.log(`SUCCESS: Found ${conferences.length} conferences`);
  return conferences;
}

function extractCvItemEvents(latex, matchesSectionTitle) {
  const sectionRegex = /\\section\{([^}]*)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;
  const events = [];
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(latex)) !== null) {
    if (!matchesSectionTitle(cleanLatexText(sectionMatch[1]))) continue;

    const section = filterCommentedContent(sectionMatch[2]);
    for (const { args: [date, details] } of extractCommandEntries(section, 'cvitem', 2)) {
      const links = extractHrefEntries(details);
      const cleanedDetails = cleanLatexText(details);
      const title = links[0]?.label || cleanedDetails.split(',')[0].trim();
      const detailsWithoutTitle = cleanedDetails
        .slice(cleanedDetails.indexOf(title) + title.length)
        .replace(/^,\s*/, '');
      const typeMatch = detailsWithoutTitle.match(/\(([^()]*)\)\s*$/);
      const type = typeMatch?.[1]?.trim() || '';
      const location = detailsWithoutTitle
        .replace(/\s*\([^()]*\)\s*$/, '')
        .replace(/,\s*$/, '')
        .trim();
      const yearMatch = cleanLatexText(date).match(/\b(?:19|20)\d{2}\b/);

      if (title) {
        events.push({
          title,
          location,
          time: yearMatch?.[0] || '',
          type,
          link: links[0]?.url || '',
          detailsLink: links[1]?.url || ''
        });
      }
    }
  }

  return events;
}

function extractLanguages(latex) {
  console.log('Extracting languages...');
  
  const languagesRegex = /\\section\{[^}]*Languages[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(languagesRegex);
  
  if (!match) {
    console.log('WARNING: No Languages section found');
    return [];
  }
  
  const languagesSection = filterCommentedContent(match[1]);
  const languages = [];
  const entries = [
    ...extractCommandEntries(languagesSection, 'detailitem', 2),
    ...extractCommandEntries(languagesSection, 'cvitemwithcomment', 3)
  ].sort((left, right) => left.index - right.index);

  for (const { args } of entries) {
    const language = cleanLatexText(args[0]);
    const level = cleanLatexText(args[1]);
    
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
          console.log(`WARNING: Unmatched language level: "${level}" for ${language}`);
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
  
  console.log(`SUCCESS: Found ${languages.length} languages`);
  return languages;
}

function extractMemberships(latex) {
  console.log('Extracting memberships...');
  
  // Look for Other Information section with Memberships subsection
  const otherInfoRegex = /\\section\{[^}]*Other Information[^}]*\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/i;
  const match = latex.match(otherInfoRegex);
  
  if (!match) {
    console.log('WARNING: No Other Information section found');
    return [];
  }
  
  const otherInfoSection = filterCommentedContent(match[1]);
  const memberships = [];
  
  // Look for Memberships subsection
  const membershipsMatch = otherInfoSection.match(/\\subsection\{[^}]*Memberships[^}]*\}([\s\S]*?)(?=\\subsection|\\section|$)/i);
  
  if (membershipsMatch) {
    const membershipsSection = filterCommentedContent(membershipsMatch[1]);
    const entries = extractEntriesForCommands(membershipsSection, ['detailitem', 'cvitem'], 2);
    
    for (const { args: [time, organization] } of entries) {
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
  
  console.log(`SUCCESS: Found ${memberships.length} memberships`);
  return memberships;
}

function escapeDoubleQuotes(value) {
  return value.replace(/"/g, '\\"');
}

function updateCvData(education, experiences, teaching, skills, reviews, honors, interests, languages, presentations, conferences, memberships) {
  const cvPath = path.join(__dirname, '..', 'src', 'data', 'cv.ts');
  
  // Read current cv.ts file
  let cvContent = fs.readFileSync(cvPath, 'utf8');
  
  // Update education section
  const educationData = education.map(edu => 
    `\t{\n\t\t"time": "${edu.time}",\n\t\t"degree": "${edu.degree ? escapeDoubleQuotes(edu.degree) : ''}",\n\t\t"school": "${edu.school ? escapeDoubleQuotes(edu.school) : ''}",\n\t\t"location": "${edu.location || ''}",\n\t\t"description": "${edu.description ? escapeDoubleQuotes(edu.description) : ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const education = \[[\s\S]*?\];/,
    `export const education = [\n${educationData}\n];`
  );
  
  // Update experiences section
  const experienceData = experiences.map(exp => 
    `\t{\n\t\t"time": "${exp.time}",\n\t\t"title": "${exp.title ? escapeDoubleQuotes(exp.title) : ''}",\n\t\t"company": "${exp.company ? escapeDoubleQuotes(exp.company) : ''}",\n\t\t"location": "${exp.location || ''}",\n\t\t"description": "${exp.description ? escapeDoubleQuotes(exp.description) : ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const experiences = \[[\s\S]*?\];/,
    `export const experiences = [\n${experienceData}\n];`
  );
  
  // Update teaching section
  const teachingData = teaching.map(teach => 
    `\t{\n\t\t"course": "${teach.course ? escapeDoubleQuotes(teach.course) : ''}",\n\t\t"role": "${teach.role ? escapeDoubleQuotes(teach.role) : ''}",\n\t\t"institution": "${teach.institution ? escapeDoubleQuotes(teach.institution) : ''}",\n\t\t"time": "${teach.time || ''}",\n\t\t"description": "${teach.description ? escapeDoubleQuotes(teach.description) : ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const teaching = \[[\s\S]*?\];/,
    `export const teaching = [\n${teachingData}\n];`
  );
  
  // Update skills section - create proper hierarchical structure
  const skillsData = skills.map(skill => 
    `\t{\n\t\t"category": "${escapeDoubleQuotes(skill.category)}",\n\t\t"level": "${escapeDoubleQuotes(skill.level)}",\n\t\t"skills": "${escapeDoubleQuotes(skill.skills)}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const skills = \[[\s\S]*?\];/,
    `export const skills = [\n${skillsData}\n];`
  );
  
  // Update reviews section
  const reviewsData = reviews.map(review => 
    `\t{\n\t\t"title": "${review.title ? escapeDoubleQuotes(review.title) : ''}",\n\t\t"venue": "${review.venue ? escapeDoubleQuotes(review.venue) : ''}",\n\t\t"time": "${review.time || ''}",\n\t\t"link": "${review.link || ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const reviews = \[[\s\S]*?\];/,
    `export const reviews = [\n${reviewsData}\n];`
  );
  
  // Update honors section
  const honorsData = honors.map(honor => 
    `\t{\n\t\t"title": "${escapeDoubleQuotes(honor.title)}",\n\t\t"description": "${honor.description ? escapeDoubleQuotes(honor.description) : ''}",\n\t\t"time": "${honor.time || ''}",\n\t\t"link": "${honor.link || ''}",\n\t\t"icon": "${honor.icon || '⭐'}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const honors = \[[\s\S]*?\];/,
    `export const honors = [\n${honorsData}\n];`
  );
  
  // Update interests section
  const interestsData = interests.map(interest => 
    `\t{\n\t\t"title": "${interest.title ? escapeDoubleQuotes(interest.title) : ''}",\n\t\t"description": "${interest.description ? escapeDoubleQuotes(interest.description) : ''}",\n\t\t"icon": "${interest.icon || ''}"\n\t}`
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
    `\t{\n\t\t"title": "${pres.title ? escapeDoubleQuotes(pres.title) : ''}",\n\t\t"location": "${pres.location ? escapeDoubleQuotes(pres.location) : ''}",\n\t\t"time": "${pres.time || ''}",\n\t\t"type": "${pres.type ? escapeDoubleQuotes(pres.type) : ''}",\n\t\t"link": "${pres.link || ''}",\n\t\t"detailsLink": "${pres.detailsLink || ''}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const presentations = \[[\s\S]*?\];/,
    `export const presentations = [\n${presentationsData}\n];`
  );

  const conferencesData = conferences.map(conference =>
    `\t{\n\t\t"title": "${conference.title ? escapeDoubleQuotes(conference.title) : ''}",\n\t\t"location": "${conference.location ? escapeDoubleQuotes(conference.location) : ''}",\n\t\t"role": "${conference.role ? escapeDoubleQuotes(conference.role) : ''}",\n\t\t"time": "${conference.time || ''}"\n\t}`
  ).join(',\n');

  cvContent = cvContent.replace(
    /export const conferences = \[[\s\S]*?\];/,
    `export const conferences = [\n${conferencesData}\n];`
  );
  
  // Update memberships section
  const membershipsData = memberships.map(member => 
    `\t{\n\t\t"title": "${escapeDoubleQuotes(member.title)}",\n\t\t"description": "${escapeDoubleQuotes(member.description)}",\n\t\t"time": "${member.time}"\n\t}`
  ).join(',\n');
  
  cvContent = cvContent.replace(
    /export const memberships = \[[\s\S]*?\];/,
    `export const memberships = [\n${membershipsData}\n];`
  );
  
  // Write updated content
  fs.writeFileSync(cvPath, cvContent);
  console.log('SUCCESS: CV data updated successfully!');
}

async function main() {
  try {
    console.log(' Starting comprehensive CV update from LaTeX...');
    
    // Read CV.tex directly
    const cvPath = path.join(__dirname, '..', 'public', 'cv', 'CV.tex');
    
    if (!fs.existsSync(cvPath)) {
      console.error('ERROR: CV.tex not found at:', cvPath);
      process.exit(1);
    }
    
    const latexContent = fs.readFileSync(cvPath, 'utf8');
    console.log('CV.tex loaded successfully');
    
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
    const conferences = extractConferences(latexContent);
    const memberships = extractMemberships(latexContent);
    
    // Update cv.ts file
    updateCvData(education, experiences, teaching, skills, reviews, honors, interests, languages, presentations, conferences, memberships);
    
    console.log(' CV update completed successfully!');
    console.log('Summary:');
    console.log(`   Education: ${education.length} entries`);
    console.log(`   Experience: ${experiences.length} entries`);
    console.log(`   Teaching: ${teaching.length} entries`);
    console.log(`   Skills: ${skills.length} entries`);
    console.log(`   Reviews: ${reviews.length} entries`);
    console.log(`   Honors: ${honors.length} entries`);
    console.log(`   Interests: ${interests.length} entries`);
    console.log(`   Languages: ${languages.length} entries`);
    console.log(`   Presentations: ${presentations.length} entries`);
    console.log(`   Conferences: ${conferences.length} entries`);
    console.log(`   Memberships: ${memberships.length} entries`);
    
  } catch (error) {
    console.error('ERROR: Error updating CV:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
