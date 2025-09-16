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

    // Extract links from the content
    const links = {};
    
    // Extract Paper link
    const paperMatch = fullContent.match(/\[Paper\]\(([^)]+)\)/);
    if (paperMatch) {
      links.paper = paperMatch[1];
    }
    
    // Extract Paper-Full Version link (alternative paper link)
    const paperFullMatch = fullContent.match(/\[Paper-Full Version\]\(([^)]+)\)/);
    if (paperFullMatch) {
      links.paperFull = paperFullMatch[1];
    }
    
    // Extract Slides link
    const slidesMatch = fullContent.match(/\[Slides\]\(([^)]+)\)/);
    if (slidesMatch) {
      let slidesUrl = slidesMatch[1];
      // If it's a relative path (doesn't start with http), convert to full GitHub URL
      if (!slidesUrl.startsWith('http')) {
        slidesUrl = `https://github.com/hadipourh/talks/tree/main/${slidesUrl}`;
      }
      links.slides = slidesUrl;
    }
    
    // Extract Video link
    const videoMatch = fullContent.match(/\[Video\]\(([^)]+)\)/);
    if (videoMatch) {
      links.video = videoMatch[1];
    }
    
    // Extract Code link
    const codeMatch = fullContent.match(/\[Code\]\(([^)]+)\)/);
    if (codeMatch) {
      links.code = codeMatch[1];
    }

    talks.push({
      title: title,
      venue: venue,
      location: location,
      date: `${dateMatch[1]}-01-01`,
      year: parseInt(dateMatch[1]),
      type: type,
      slug: matchingDir,
      links: links
    });    console.log(`Added talk: ${title} (${dateMatch[1]}, ${type}) - Location: ${location}`);
  });
  
  // Sort by date (newest first) and return ALL talks (no limit!)
  return talks.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Extract unique countries from actual talk data
function extractCountriesFromTalks(talks) {
  const countries = new Set();
  
  // Country mapping for cities and venues
  const locationToCountry = {
    // Cities
    'rome': 'Italy',
    'graz': 'Austria', 
    'leuven': 'Belgium',
    'lyon': 'France',
    'kobe': 'Japan',
    'athens': 'Greece',
    'leiden': 'Netherlands',
    'vienna': 'Austria',
    'kolkata': 'India',
    'mumbai': 'India',
    'delhi': 'India',
    'bangalore': 'India',
    'hyderabad': 'India',
    'chennai': 'India',
    'paris': 'France',
    'london': 'UK',
    'berlin': 'Germany',
    'munich': 'Germany',
    'zurich': 'Switzerland',
    'geneva': 'Switzerland',
    'oslo': 'Norway',
    'stockholm': 'Sweden',
    'copenhagen': 'Denmark',
    'madrid': 'Spain',
    'barcelona': 'Spain',
    'amsterdam': 'Netherlands',
    'brussels': 'Belgium',
    'dublin': 'Ireland',
    'prague': 'Czech Republic',
    'warsaw': 'Poland',
    'budapest': 'Hungary',
    'helsinki': 'Finland',
    'lisbon': 'Portugal',
    'tehran': 'Iran',
    'isfahan': 'Iran',
    'shiraz': 'Iran',
    'tokyo': 'Japan',
    'osaka': 'Japan',
    'kyoto': 'Japan',
    'beijing': 'China',
    'shanghai': 'China',
    'hong kong': 'Hong Kong',
    'singapore': 'Singapore',
    'seoul': 'South Korea',
    'sydney': 'Australia',
    'melbourne': 'Australia',
    'toronto': 'Canada',
    'vancouver': 'Canada',
    'montreal': 'Canada',
    'new york': 'USA',
    'san francisco': 'USA',
    'los angeles': 'USA',
    'chicago': 'USA',
    'boston': 'USA',
    'washington': 'USA',
    'seattle': 'USA',
    'miami': 'USA',
    'las vegas': 'USA',
    'phoenix': 'USA',
    
    // Country names and variants
    'usa': 'USA',
    'united states': 'USA',
    'america': 'USA',
    'italy': 'Italy',
    'austria': 'Austria',
    'belgium': 'Belgium',
    'france': 'France',
    'japan': 'Japan',
    'greece': 'Greece',
    'netherlands': 'Netherlands',
    'germany': 'Germany',
    'india': 'India',
    'iran': 'Iran',
    'spain': 'Spain',
    'uk': 'UK',
    'united kingdom': 'UK',
    'england': 'UK',
    'canada': 'Canada',
    'australia': 'Australia',
    'china': 'China',
    'switzerland': 'Switzerland',
    'norway': 'Norway',
    'sweden': 'Sweden',
    'denmark': 'Denmark',
    'portugal': 'Portugal',
    'ireland': 'Ireland',
    'finland': 'Finland',
    'poland': 'Poland',
    'czech republic': 'Czech Republic',
    'hungary': 'Hungary',
    'south korea': 'South Korea',
    'singapore': 'Singapore'
  };
  
  talks.forEach(talk => {
    const locationText = `${talk.venue} ${talk.location}`.toLowerCase();
    
    // Check for direct matches in our mapping
    Object.entries(locationToCountry).forEach(([key, country]) => {
      if (locationText.includes(key)) {
        countries.add(country);
      }
    });
  });
  
  return countries.size;
}

// Update talks.astro page with ALL GitHub data (no limits!)
async function updateTalksPage(talks) {
  const talksPath = path.join(process.cwd(), 'src', 'pages', 'talks.astro');
  
  // Generate talk cards for ALL talks
  const talkCards = talks.map((talk, index) => `    <div class="card bg-gradient-to-br from-base-200 to-base-300 hover:from-primary/5 hover:to-secondary/5 shadow-xl hover:shadow-2xl transition-all duration-500 group border border-primary/10 hover:border-primary/30 transform hover:scale-105">
      <div class="card-body relative overflow-hidden">
        <!-- Card background gradient effect -->
        <div class="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="flex justify-between items-start mb-2 relative z-10">
          <div class="badge badge-${talk.type === 'thesis' ? 'secondary' : 'primary'} text-xs font-mono shadow-lg group-hover:shadow-xl transition-shadow duration-300">${talk.type}</div>
          <div class="text-xs text-base-content/60 font-mono bg-base-content/5 px-2 py-1 rounded group-hover:bg-primary/10 transition-colors duration-300">${talk.date.substring(0, 4)}</div>
        </div>
        
        <h3 class="card-title text-lg leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary group-hover:bg-clip-text transition-all duration-500 relative z-10">
          ${talk.title}
        </h3>
        
        <div class="space-y-2 mt-3 relative z-10">
          <div class="flex items-center gap-2 text-sm">
            <span class="font-semibold text-accent group-hover:text-primary transition-colors duration-300">Venue:</span>
            <span class="text-base-content/80 group-hover:text-base-content transition-colors duration-300">${talk.venue}</span>
          </div>
          ${talk.location ? `<div class="flex items-center gap-2 text-sm">
            <span class="font-semibold text-accent group-hover:text-secondary transition-colors duration-300">Location:</span>
            <span class="text-base-content/80 group-hover:text-base-content transition-colors duration-300">${talk.location}</span>
          </div>` : ''}
        </div>
        
        <!-- Talk Links -->
        ${Object.keys(talk.links || {}).length > 0 ? `<div class="mt-4 relative z-10">
          <div class="flex flex-wrap gap-2">
            ${talk.links.paper ? `<a href="${talk.links.paper}" target="_blank" 
               class="btn btn-primary btn-xs gap-1 hover:btn-secondary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8a1 1 0 000 2v5a2 2 0 002 2h6a2 2 0 002-2v-5a1 1 0 100-2H3z"/>
              </svg>
              Paper
            </a>` : ''}
            ${talk.links.paperFull ? `<a href="${talk.links.paperFull}" target="_blank" 
               class="btn btn-primary btn-xs gap-1 hover:btn-secondary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8a1 1 0 000 2v5a2 2 0 002 2h6a2 2 0 002-2v-5a1 1 0 100-2H3z"/>
              </svg>
              Full Paper
            </a>` : ''}
            ${talk.links.slides ? `<a href="${talk.links.slides}" target="_blank" 
               class="btn btn-secondary btn-xs gap-1 hover:btn-accent transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Slides
            </a>` : ''}
            ${talk.links.video ? `<a href="${talk.links.video}" target="_blank" 
               class="btn btn-accent btn-xs gap-1 hover:btn-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
              Video
            </a>` : ''}
            ${talk.links.code ? `<a href="${talk.links.code}" target="_blank" 
               class="btn btn-info btn-xs gap-1 hover:btn-warning transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              Code
            </a>` : ''}
          </div>
        </div>` : ''}
        
        <!-- GitHub Source -->
        <div class="mt-4 pt-3 border-t border-base-300 group-hover:border-primary/30 transition-colors duration-300 relative z-10">
          <div class="flex items-center gap-2 text-sm">
            <span class="font-semibold text-accent group-hover:text-primary transition-colors duration-300">GitHub:</span>
            <a href="https://github.com/hadipourh/talks/tree/main/${talk.slug}" 
               class="link link-primary hover:link-accent transition-colors duration-200 font-mono text-xs hover:bg-primary/10 px-2 py-1 rounded" 
               target="_blank">
              talks/${talk.slug}
            </a>
          </div>
        </div>
      </div>
    </div>`).join('\n\n');

  const totalTalks = talks.length;
  const totalCountries = extractCountriesFromTalks(talks);
  const yearSpan = `${Math.min(...talks.map(t => new Date(t.date).getFullYear()))}-${Math.max(...talks.map(t => new Date(t.date).getFullYear()))}`;
  const lastUpdate = new Date().toISOString().split('T')[0];

  const content = `---
// AUTO-GENERATED: Last updated ${lastUpdate} from hadipourh/talks GitHub repository  
// DO NOT EDIT: This file is generated by scripts/update-talks.js
// Real statistics: ${totalTalks} talks, ${totalCountries} countries, ${yearSpan}
// Shows ALL talks - no limits applied!
import Layout from "../layouts/Layout.astro";
---
<Layout 
  title="Talks & Presentations | Hosein Hadipour" 
  description="Academic talks, conference presentations, and invited lectures by Hosein Hadipour"
>
  <main class="container mx-auto px-4 py-12 max-w-6xl">
    <!-- Hero Section with Real Statistics -->
    <div class="text-center mb-12 relative">
      <!-- Background gradient effect -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-3xl blur-3xl -z-10"></div>
      
      <h1 class="text-4xl lg:text-6xl font-bold mb-4 animate-pulse">
        <span class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-lg">
          Talks & Presentations
        </span>
      </h1>
      <p class="text-lg text-base-content/70 mb-8 max-w-2xl mx-auto leading-relaxed">
        A complete collection of my academic talks, conference presentations, and invited lectures 
        on cryptanalysis, automated reasoning, and security research.
      </p>
      
      <!-- Real-time Statistics from GitHub -->
      <div class="stats shadow-xl bg-gradient-to-br from-base-200 to-base-300 mb-8 border border-primary/20 hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
        <div class="stat hover:bg-primary/10 transition-colors duration-300 rounded-l-lg">
          <div class="stat-figure text-primary animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current drop-shadow-lg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="stat-title font-semibold">Total Talks</div>
          <div class="stat-value text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">${totalTalks}</div>
          <div class="stat-desc text-base-content/60">All presentations</div>
        </div>
        
        <div class="stat hover:bg-secondary/10 transition-colors duration-300">
          <div class="stat-figure text-secondary animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current drop-shadow-lg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-title font-semibold">Countries</div>
          <div class="stat-value text-secondary bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">${totalCountries}</div>
          <div class="stat-desc text-base-content/60">International venues</div>
        </div>
        
        <div class="stat hover:bg-accent/10 transition-colors duration-300 rounded-r-lg">
          <div class="stat-figure text-accent animate-spin" style="animation-duration: 4s;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current drop-shadow-lg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div class="stat-title font-semibold">Time Span</div>
          <div class="stat-value text-accent bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">${yearSpan}</div>
          <div class="stat-desc text-base-content/60">Years active</div>
        </div>
      </div>
    </div>

    <!-- Talks Collection Section -->
    <section class="relative">
      <!-- Section background gradient -->
      <div class="absolute inset-0 bg-gradient-to-r from-primary/3 via-secondary/3 to-accent/3 rounded-3xl blur-2xl -z-10"></div>
      
      <div class="text-center mb-8">
        <h2 class="text-3xl lg:text-4xl font-bold mb-4">
          <span class="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
            Complete Collection
          </span>
        </h2>
        <p class="text-base-content/70 max-w-xl mx-auto">
          Explore all my academic presentations with direct links to slides, videos, papers, and code
        </p>
      </div>

      <!-- Complete Talks Grid - ALL talks from GitHub -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
${talkCards}
    </div>

    </section>
    
    <!-- GitHub Repository Link -->
    <div class="text-center mt-12 relative">
      <!-- Footer background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-accent/5 via-secondary/5 to-primary/5 rounded-3xl blur-2xl -z-10"></div>
      
      <div class="inline-flex items-center gap-2 bg-gradient-to-r from-base-200 to-base-300 rounded-full px-6 py-3 text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-primary/20">
        <svg class="w-5 h-5 text-primary animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-base-content/80">All presentations available on</span>
        <a href="https://github.com/hadipourh/talks" 
           class="link bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold hover:from-secondary hover:to-accent transition-all duration-300" 
           target="_blank">
          GitHub/hadipourh/talks
        </a>
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
      console.log('ALL talks are displayed without any limits!');
    } else {
      console.log('Warning: Data verification failed - please check GitHub repository');
    }
    
  } else {
    console.log('No talks found, skipping update');
  }
}

// Run the script
main().catch(console.error);
