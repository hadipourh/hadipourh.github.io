#!/usr/bin/env node

/**
 * Auto-update talks from GitHub repository
 * This script fetches talks from hadipourh/talks and updates src/pages/talks.astro
 */

import fs from 'fs/promises';
import path from 'path';

const GITHUB_API = 'https://api.github.com';
const TALKS_REPO = 'hadipourh/talks';

async function fetchTalksFromGitHub() {
  try {
    console.log('Fetching talks from GitHub repository...');
    
    // Get repository contents
    const response = await fetch(`${GITHUB_API}/repos/${TALKS_REPO}/contents`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Academic-Website-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }
    
    const contents = await response.json();
    
    // Filter directories that match talk pattern (YYYYMMDD-*)
    const talkDirs = contents
      .filter(item => item.type === 'dir' && /^\d{8}-/.test(item.name))
      .sort((a, b) => b.name.localeCompare(a.name)); // Sort by date descending
    
    console.log(`🎤 Found ${talkDirs.length} talk directories`);
    
    // Get README.md content to extract talk information
    const readmeResponse = await fetch(`${GITHUB_API}/repos/${TALKS_REPO}/contents/README.md`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Academic-Website-Bot'
      }
    });
    
    let talks = [];
    
    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json();
      const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      
      // Parse README to extract talk information
      talks = parseTalksFromReadme(readmeContent, talkDirs);
    } else {
      // Fallback: generate talks from directory names
      talks = generateTalksFromDirs(talkDirs);
    }
    
    return talks;
    
  } catch (error) {
    console.error('ERROR: Error fetching talks from GitHub:', error.message);
    return [];
  }
}

function parseTalksFromReadme(readmeContent, talkDirs) {
  const talks = [];
  const sections = readmeContent.split('##').slice(1); // Skip first empty section
  
  for (const section of sections) {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    
    if (!title || title === 'Credits' || title === 'About') continue;
    
    let venue = '';
    let paper = '';
    let slides = '';
    let video = '';
    let code = '';
    let year = '';
    
    // Extract information from section
    for (const line of lines) {
      if (line.includes('- [Paper](')) {
        paper = line.match(/\[Paper\]\((.*?)\)/)?.[1] || '';
      }
      if (line.includes('- [Slides](')) {
        const slidesMatch = line.match(/\[Slides\]\((.*?)\)/)?.[1] || '';
        // Convert relative path to full GitHub URL
        if (slidesMatch && !slidesMatch.startsWith('http')) {
          slides = `https://github.com/${TALKS_REPO}/tree/main/${slidesMatch}`;
        } else {
          slides = slidesMatch;
        }
      }
      if (line.includes('- [Video](')) {
        video = line.match(/\[Video\]\((.*?)\)/)?.[1] || '';
      }
      if (line.includes('- [Code](')) {
        code = line.match(/\[Code\]\((.*?)\)/)?.[1] || '';
      }
      if (line.includes('- Venue:') || line.includes('- Location:')) {
        // Extract venue, handling both markdown links and plain text
        let venueText = line.replace(/- (Venue|Location): /, '').trim();
        // If it's a markdown link like [Santa Barbara, USA](url), extract just the text
        const linkMatch = venueText.match(/\[([^\]]+)\]/);
        venue = linkMatch ? linkMatch[1] : venueText;
      }
    }
    
    // Extract year from title or venue
    const yearMatch = title.match(/(\d{4})/) || venue.match(/(\d{4})/);
    year = yearMatch ? yearMatch[1] : '';
    
    talks.push({
      title: title.replace(/ - \w+ \d{4}$/, ''), // Remove venue suffix
      venue,
      year,
      paper,
      slides,
      video,
      code,
      type: detectTalkType(title, venue)
    });
  }
  
  return talks.slice(0, 15); // Limit to recent talks
}

function generateTalksFromDirs(talkDirs) {
  return talkDirs.slice(0, 15).map(dir => {
    const parts = dir.name.split('-');
    const date = parts[0];
    const year = date.substring(0, 4);
    const venue = parts.slice(1).join(' ');
    
    return {
      title: `Research Presentation`,
      venue: venue.replace(/([A-Z])/g, ' $1').trim(),
      year,
      slides: `https://github.com/${TALKS_REPO}/blob/main/${dir.name}`,
      paper: '',
      video: '',
      code: '',
      type: 'conference'
    };
  });
}

function detectTalkType(title, venue) {
  const lowerTitle = title.toLowerCase();
  const lowerVenue = venue.toLowerCase();
  
  if (lowerTitle.includes('defense') || lowerTitle.includes('thesis')) return 'thesis';
  if (lowerVenue.includes('workshop') || lowerVenue.includes('ask') || lowerVenue.includes('skcam')) return 'workshop';
  if (lowerVenue.includes('lecture') || lowerVenue.includes('seminar')) return 'lecture';
  if (lowerVenue.includes('crypto') || lowerVenue.includes('eurocrypt') || lowerVenue.includes('fse') || lowerVenue.includes('ches')) return 'conference';
  
  return 'conference';
}

async function updateTalksPage(talks) {
  try {
    const talksPath = path.join(process.cwd(), 'src', 'pages', 'talks.astro');
    
    // Read current talks.astro content
    let content = await fs.readFile(talksPath, 'utf-8');
    
    // Generate timeline HTML for talks
    const timelineItems = talks.map((talk, index) => {
      const isLeft = index % 2 === 0; // Left side for even indices
      const badgeType = getBadgeType(talk.type);
      const links = generateLinks(talk);
      
      if (isLeft) {
        // Left side item
        return `				<!-- Talk ${index + 1}: ${talk.title.substring(0, 30)}... (Left) -->
				<li>
					<div class='timeline-start timeline-box bg-base-100 shadow-xl'>
						<h3 class='font-bold text-lg'>${talk.title}</h3>
						<p class='text-gray-600'>${talk.venue || 'Conference Presentation'}</p>
						<div class='flex flex-wrap gap-2 mt-3'>
							<div class='badge ${badgeType}'>${getTypeLabel(talk.type)}</div>
							<div class='badge badge-outline'>${extractTopic(talk.title)}</div>
						</div>${links ? `
						<div class='flex flex-wrap gap-2 mt-2'>${links}
						</div>` : ''}
					</div>
					<div class='timeline-middle'>
						<div class='w-3 h-3 bg-primary rounded-full'></div>
					</div>
					<div class='timeline-end'></div>
				</li>`;
      } else {
        // Right side item
        return `				<!-- Talk ${index + 1}: ${talk.title.substring(0, 30)}... (Right) -->
				<li>
					<div class='timeline-start'></div>
					<div class='timeline-middle'>
						<div class='w-3 h-3 bg-primary rounded-full'></div>
					</div>
					<div class='timeline-end timeline-box bg-base-100 shadow-xl'>
						<h3 class='font-bold text-lg'>${talk.title}</h3>
						<p class='text-gray-600'>${talk.venue || 'Conference Presentation'}</p>
						<div class='flex flex-wrap gap-2 mt-3'>
							<div class='badge ${badgeType}'>${getTypeLabel(talk.type)}</div>
							<div class='badge badge-outline'>${extractTopic(talk.title)}</div>
						</div>${links ? `
						<div class='flex flex-wrap gap-2 mt-2'>${links}
						</div>` : ''}
					</div>
				</li>`;
      }
    }).join('\n\n');
    
    // Replace the timeline section
    const timelineStart = content.indexOf('<ul class=\'timeline timeline-vertical\'>');
    const timelineEnd = content.indexOf('</ul>', timelineStart) + 5;
    
    if (timelineStart !== -1 && timelineEnd !== -1) {
      const newTimelineSection = `<ul class='timeline timeline-vertical'>
${timelineItems}
			</ul>`;
      
      content = content.substring(0, timelineStart) + 
                newTimelineSection + 
                content.substring(timelineEnd);
      
      await fs.writeFile(talksPath, content, 'utf-8');
      console.log('SUCCESS: Updated talks.astro with proper timeline structure');
    } else {
      console.log('WARNING: Could not find <ul> timeline section in talks.astro');
    }
    
  } catch (error) {
    console.error('ERROR: Error updating talks.astro:', error.message);
  }
}

function getBadgeType(type) {
  switch (type) {
    case 'conference': return 'badge-primary';
    case 'workshop': return 'badge-secondary';
    case 'lecture': return 'badge-accent';
    case 'thesis': return 'badge-info';
    default: return 'badge-primary';
  }
}

function getTypeLabel(type) {
  switch (type) {
    case 'conference': return 'Conference';
    case 'workshop': return 'Workshop';
    case 'lecture': return 'Lecture';
    case 'thesis': return 'Ph.D. Defense';
    default: return 'Conference';
  }
}

function extractTopic(title) {
  if (title.includes('Differential-Linear')) return 'Differential-Linear';
  if (title.includes('Boomerang')) return 'Boomerang';
  if (title.includes('Cryptanalysis')) return 'Cryptanalysis';
  if (title.includes('Automated')) return 'Automated';
  if (title.includes('Algebraic')) return 'Algebraic';
  if (title.includes('Integral')) return 'Integral';
  if (title.includes('Impossible')) return 'Impossible';
  if (title.includes('Fault')) return 'Fault Attacks';
  return 'Cryptanalysis';
}

function generateLinks(talk) {
  let links = [];
  
  if (talk.paper) {
    links.push(`<a href='${talk.paper}' target='_blank' class='btn btn-xs btn-outline btn-primary'>📄 Paper</a>`);
  }
  if (talk.slides) {
    links.push(`<a href='${talk.slides}' target='_blank' class='btn btn-xs btn-outline btn-secondary'>📊 Slides</a>`);
  }
  if (talk.video) {
    links.push(`<a href='${talk.video}' target='_blank' class='btn btn-xs btn-outline btn-accent'>🎥 Video</a>`);
  }
  if (talk.code) {
    links.push(`<a href='${talk.code}' target='_blank' class='btn btn-xs btn-outline btn-info'>💻 Code</a>`);
  }
  
  return links.length > 0 ? `
							${links.join('\n\t\t\t\t\t\t\t')}` : '';
}

async function main() {
  console.log('Starting talks update process...');
  
  const talks = await fetchTalksFromGitHub();
  
  if (talks.length > 0) {
    await updateTalksPage(talks);
    console.log('Talks update completed!');
  } else {
    console.log('WARNING: No talks found, skipping update');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
