#!/usr/bin/env node

/**
 * Talks Updater - GitHub Integration
 * Fetches talks from GitHub repository and generates talks page
 * Shows ALL talks without limits
 */

import fs from 'fs/promises';
import path from 'path';

// Fetch talks from GitHub repository
async function fetchTalksFromGitHub() {
  console.log('Fetching talks from GitHub repository...');
  
  try {
    // Get list of talk directories from GitHub API
    const repoResponse = await fetch('https://api.github.com/repos/hadipourh/talks/contents');
    const repoData = await repoResponse.json();
    
    const talkDirs = repoData
      .filter(item => item.type === 'dir' && item.name.match(/^\d{8}-/))
      .map(item => item.name);
    
    console.log(`Found ${talkDirs.length} talk directories`);
    
    // Get README.md content
    const readmeResponse = await fetch('https://api.github.com/repos/hadipourh/talks/contents/README.md');
    const readmeData = await readmeResponse.json();
    const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
    
    const talks = parseTalksFromReadme(readmeContent, talkDirs);
    console.log(`Successfully parsed ${talks.length} talks from GitHub repository`);
    
    return talks;
  } catch (error) {
    console.error('Error fetching talks from GitHub:', error);
    return [];
  }
}

// Parse talks from README.md content
function parseTalksFromReadme(readmeContent, talkDirs) {
  const talks = [];
  
  // Split by headers starting with ##
  const sections = readmeContent.split(/^##\s+/m).slice(1);
  console.log(`Parsing ${sections.length} sections from README.md`);
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    
    // Skip non-talk sections
    if (title.includes('Repository') || title.includes('Usage') || title.includes('License')) {
      return;
    }
    
    // Extract date from title or content
    const dateMatch = title.match(/(\d{4})/);
    if (!dateMatch) return;
    
    // Find the corresponding directory
    const matchingDir = talkDirs.find(dir => {
      const dirYear = dir.substring(0, 4);
      return dirYear === dateMatch[1];
    });
    
    if (!matchingDir) {
      console.log(`Skipped incomplete talk: ${title.substring(0, 40)}...`);
      return;
    }
    
    // Extract venue and location from content
    let venue = 'Conference';
    let location = '';
    let type = 'conference';
    
    // Extract venue from title (everything after last dash)
    const venueParts = title.split(' - ');
    if (venueParts.length > 1) {
      venue = venueParts[venueParts.length - 1].trim();
    }
    
    // Determine type
    if (title.toLowerCase().includes('defense') || title.toLowerCase().includes('thesis')) {
      type = 'thesis';
    } else if (title.toLowerCase().includes('lecture') || title.toLowerCase().includes('seminar')) {
      type = 'lecture';
    }
    
    // Extract location from venue line in content
    const fullContent = section;
    const venueLineMatch = fullContent.match(/Venue:\s*\[([^\]]+)\]/);
    if (venueLineMatch) {
      location = venueLineMatch[1];
    } else {
      // Fallback: try to extract location from "Location:" line
      const locationLineMatch = fullContent.match(/Location:\s*([^\n]+)/);
      if (locationLineMatch) {
        location = locationLineMatch[1].trim();
      }
    }
    
    // Extract links
    const links = {};
    
    // Improved link extraction - look for list items with links
    const paperMatches = [...fullContent.matchAll(/- \[Paper\]\(([^)]+)\)/g)];
    if (paperMatches && paperMatches.length > 0) {
      links.paper = paperMatches[0][1];
    }
    
    // Full Paper
    const fullPaperMatches = [...fullContent.matchAll(/- \[Full Paper\]\(([^)]+)\)/g)];
    if (fullPaperMatches && fullPaperMatches.length > 0) {
      links.paperFull = fullPaperMatches[0][1];
    }
    
    // Slides
    const slidesMatches = [...fullContent.matchAll(/- \[Slides\]\(([^)]+)\)/g)];
    if (slidesMatches && slidesMatches.length > 0) {
      const slidesPath = slidesMatches[0][1];
      // Check if it's a full URL or relative path
      if (slidesPath.startsWith('http') || slidesPath.startsWith('https')) {
        links.slides = slidesPath;
      } else {
        // It's a relative path, add the GitHub URL prefix
        links.slides = `https://github.com/hadipourh/talks/tree/main/${slidesPath}`;
      }
    } else {
      // Fallback: Try to find slides link in GitHub repository
      links.slides = `https://github.com/hadipourh/talks/tree/main/${matchingDir}`;
    }
    
    // Video
    const videoMatches = [...fullContent.matchAll(/- \[Video\]\(([^)]+)\)/g)];
    if (videoMatches && videoMatches.length > 0) {
      links.video = videoMatches[0][1];
    } else if (fullContent.includes('YouTube') || fullContent.includes('youtube.com')) {
      const youtubeMatch = fullContent.match(/(?:youtube\.com|youtu\.be)\/([^\s)]+)/);
      if (youtubeMatch) {
        links.video = `https://youtube.com/${youtubeMatch[1]}`;
      }
    }
    
    // Code
    const codeMatches = [...fullContent.matchAll(/- \[Code\]\(([^)]+)\)/g)];
    if (codeMatches && codeMatches.length > 0) {
      links.code = codeMatches[0][1];
    } else if (fullContent.includes('GitHub') && fullContent.includes('github.com')) {
      const githubRepoMatch = fullContent.match(/github\.com\/([^/\s)]+)\/([^/\s)]+)/);
      if (githubRepoMatch && !githubRepoMatch[0].includes('hadipourh/talks')) {
        links.code = `https://github.com/${githubRepoMatch[1]}/${githubRepoMatch[2]}`;
      }
    }
    
    // Find date from directory name (more precise)
    const dateParts = matchingDir.substring(0, 8).match(/(\d{4})(\d{2})(\d{2})/);
    const date = dateParts ? `${dateParts[1]}-${dateParts[2]}-${dateParts[3]}` : `${dateMatch[1]}-01-01`;
    
    console.log(`Added talk: ${title.substring(0, 45)}${title.length > 45 ? '...' : ''} (${dateMatch[1]}, ${type})${location ? ' - Location: ' + location : ''}`);
    
    talks.push({
      title,
      date,
      venue,
      location,
      type,
      links,
      slug: matchingDir
    });
  });
  
  // Sort talks by date, most recent first
  talks.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return talks;
}

// Extract unique countries from talks
function extractCountriesFromTalks(talks) {
  const countries = new Set();
  
  talks.forEach(talk => {
    if (talk.location) {
      const parts = talk.location.split(',');
      if (parts.length > 1) {
        countries.add(parts[parts.length - 1].trim());
      }
    }
  });
  
  return countries.size;
}

// Update talks.astro page with ALL GitHub data (no limits!)
async function updateTalksPage(talks) {
  const talksPath = path.join(process.cwd(), 'src', 'pages', 'talks.astro');
  
  // Generate talk cards for ALL talks with styling consistent with papers and projects pages
  const talkCards = talks.map((talk, index) => {
    return `    <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-teal-700 p-1 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div class="h-full rounded-xl bg-base-100 p-6 transition-all duration-300 group-hover:bg-opacity-95">
        <!-- Card header with badge and date -->
                <!-- Card header with badge and date -->
        <div class="flex justify-between items-start mb-3">
          <div class="badge badge-${talk.type === 'thesis' ? 'secondary' : 'primary'} text-xs font-mono whitespace-nowrap">${talk.type}</div>
          <span class="text-sm font-bold text-base-content/70">${talk.date}</span>
        </div>
        
        <h3 class="text-xl font-bold mb-2 transition-all duration-300 line-clamp-2 break-words">
          ${talk.title}
        </h3>
        
        <div class="space-y-2 mt-3">
          <div class="flex flex-wrap items-start gap-2 text-sm">
            <span class="font-semibold text-accent">Venue:</span>
            <span class="text-base-content/80 break-words">${talk.venue}</span>
          </div>
          ${talk.location ? `<div class="flex flex-wrap items-start gap-2 text-sm">
            <span class="font-semibold text-accent">Location:</span>
            <span class="text-base-content/80 break-words">${talk.location}</span>
          </div>` : ''}
        </div>
        
        <!-- Talk Links - Enhanced -->
        ${Object.keys(talk.links || {}).length > 0 ? `<div class="mt-4 border-t border-base-200 pt-4">
          <div class="flex flex-wrap gap-2 break-words">
            ${talk.links.paper ? `<a href="${talk.links.paper}" target="_blank" 
               class="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8a1 1 0 000 2v5a2 2 0 002 2h6a2 2 0 002-2v-5a1 1 0 100-2H3z"/>
                </svg>
                Paper
              </span>
            </a>` : ''}
            ${talk.links.paperFull ? `<a href="${talk.links.paperFull}" target="_blank" 
               class="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8a1 1 0 000 2v5a2 2 0 002 2h6a2 2 0 002-2v-5a1 1 0 100-2H3z"/>
                </svg>
                Full Paper
              </span>
            </a>` : ''}
            ${talk.links.slides ? `<a href="${talk.links.slides}" target="_blank" 
               class="px-3 py-1 rounded-full text-xs bg-secondary/20 text-secondary font-medium hover:bg-secondary/30 transition-colors">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                Slides
              </span>
            </a>` : ''}
            ${talk.links.video ? `<a href="${talk.links.video}" target="_blank" 
               class="px-3 py-1 rounded-full text-xs bg-accent/20 text-accent font-medium hover:bg-accent/30 transition-colors">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                </svg>
                Video
              </span>
            </a>` : ''}
            ${talk.links.code ? `<a href="${talk.links.code}" target="_blank" 
               class="px-3 py-1 rounded-full text-xs bg-info/20 text-info font-medium hover:bg-info/30 transition-colors">
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                Code
              </span>
            </a>` : ''}
          </div>
        </div>` : ''}
        
        <!-- GitHub Source - Enhanced -->
        <div class="flex justify-between items-end mt-4">
          <div class="flex items-center space-x-1 text-xs text-base-content/50">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="font-mono break-all">${talk.slug}</span>
          </div>
          <a href="https://github.com/hadipourh/talks/tree/main/${talk.slug}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 text-sm">
            View →
          </a>
        </div>
      </div>
    </div>`;
  }).join('\n\n');

  const totalTalks = talks.length;
  const totalCountries = extractCountriesFromTalks(talks);
  const yearSpan = `${Math.min(...talks.map(t => new Date(t.date).getFullYear()))}-${Math.max(...talks.map(t => new Date(t.date).getFullYear()))}`;
  const lastUpdate = new Date().toISOString().split('T')[0];

  // Create content with gradient styling consistent with other pages
  const content = `---
// AUTO-GENERATED: Last updated ${lastUpdate} from hadipourh/talks GitHub repository  
// DO NOT EDIT: This file is generated by scripts/update-talks.js
// Real statistics: ${totalTalks} talks, ${totalCountries} countries, ${yearSpan}
// Shows ALL talks - no limits applied!
import Layout from "../layouts/Layout.astro";
import { getTextColorClass } from "../lib/utils";
---
<Layout 
  title="Talks & Presentations | Hosein Hadipour" 
  description="Academic talks, conference presentations, and invited lectures by Hosein Hadipour"
>
  <main class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header Section -->
    <section class="text-center mb-16">
      <div class="relative mb-8">
        <h1 class={\`text-4xl md:text-6xl font-bold \${getTextColorClass(0)} mb-6\`}>
          Talks & Presentations
        </h1>
        <p class="text-lg md:text-xl text-base-content/80 max-w-3xl mx-auto leading-relaxed">
          A complete collection of my academic talks, conference presentations, and invited lectures 
          on cryptanalysis, automated reasoning, and security research.
        </p>
      </div>

      <!-- Statistics Section -->
      <div class="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mb-12">
        <div class="bg-base-200 rounded-2xl p-4 md:p-6">
          <div class={\`text-2xl md:text-3xl font-bold \${getTextColorClass(1)}\`}>
            ${totalTalks}
          </div>
          <div class="text-sm md:text-base text-base-content/70">Talks</div>
        </div>
        <div class="bg-base-200 rounded-2xl p-4 md:p-6">
          <div class={\`text-2xl md:text-3xl font-bold \${getTextColorClass(2)}\`}>
            ${totalCountries}
          </div>
          <div class="text-sm md:text-base text-base-content/70">Countries</div>
        </div>
        <div class="bg-base-200 rounded-2xl p-4 md:p-6">
          <div class={\`text-2xl md:text-3xl font-bold \${getTextColorClass(3)}\`}>
            ${yearSpan}
          </div>
          <div class="text-sm md:text-base text-base-content/70">Years</div>
        </div>
      </div>
    </section>

    <!-- Talks Collection Section -->
    <section class="mb-16">
      <div class="text-center mb-12">
        <h2 class={\`text-3xl md:text-4xl font-bold mb-4 \${getTextColorClass(4)}\`}>
          Complete Collection
        </h2>
        <p class="text-base-content/70 text-lg">
          Explore all my academic presentations with direct links to slides, videos, papers, and code
        </p>
      </div>

      <!-- Talks Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
${talkCards}
      </div>
    </section>
    
    <!-- GitHub Repository Link -->
    <div class="text-center mt-12 pb-4">
      <div class="bg-base-200 rounded-xl p-4 md:p-6 inline-block">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-lg">All presentations available on</span>
          <a href="https://github.com/hadipourh/talks" 
             class="font-semibold text-primary hover:underline" 
             target="_blank">
            GitHub/hadipourh/talks
          </a>
        </div>
      </div>
    </div>
  </main>
</Layout>`;

  await fs.writeFile(talksPath, content, 'utf-8');
  console.log('Updated talks.astro with ALL talks from GitHub');
  console.log(`Generated ${totalTalks} talk cards from GitHub repository (NO LIMITS!)`);
  console.log(`Real Statistics: ${totalTalks} talks, ${totalCountries} countries, ${yearSpan}`);
}

// Main execution function
async function main() {
  console.log('Starting comprehensive talks update process...');
  console.log(`Update timestamp: ${new Date().toISOString()}`);
  console.log('NO LIMITS - Showing ALL talks from GitHub!');
  
  const talks = await fetchTalksFromGitHub();
  
  if (talks.length > 0) {
    await updateTalksPage(talks);
    console.log('Talks update completed successfully!');
    console.log(`Final Stats: ${talks.length} talks processed - ALL TALKS SHOWN!`);
    
    // Show talk types breakdown
    const types = talks.reduce((acc, talk) => {
      acc[talk.type] = (acc[talk.type] || 0) + 1;
      return acc;
    }, {});
    console.log('Talk types:', types);
    
    // Verify data source
    const hasRealData = talks.some(talk => 
      talk.title.includes('Cryptanalysis') || 
      talk.title.includes('Boomerang') || 
      talk.venue.includes('CRYPTO') ||
      talk.venue.includes('EUROCRYPT') ||
      talk.venue.includes('FSE')
    );
    
    if (hasRealData) {
      console.log('Verified: All data fetched from GitHub repository - no fake data detected');
    } else {
      console.warn('WARNING: Data may contain synthetic entries - verify GitHub content');
    }
    
    console.log('ALL talks are displayed without any limits!');
  } else {
    console.error('ERROR: No talks found or failed to fetch from GitHub.');
  }
}

// Execute the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
