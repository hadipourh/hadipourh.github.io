#!/usr/bin/env node

/**
 * Publications Updater - Comprehensive DBLP Integration
 * Fetches publications from DBLP and ranks them by venue prestige
 * Updates the publications page with real statistics and content
 */

import fs from 'fs/promises';
import path from 'path';

const DBLP_API = 'https://dblp.org/search/publ/api';
const AUTHOR_NAME = 'Hosein Hadipour';

// Venue prestige ranking (higher score = more prestigious)
// Based on cryptography/security conference/journal rankings from community consensus
// 
// Venue Equivalencies:
// - FSE ≡ IACR Trans. Symmetric Cryptol.
// - CHES ≡ IACR Trans. Cryptogr. Hardw. Embed. Syst.
//
// Methodology: 100-point scale where top-tier venues (CRYPTO, EUROCRYPT) = 100 points,
// premier venues (ASIACRYPT, IACR Trans) = 95 points, high-quality venues (FSE, CHES) = 90 points,
// etc., with preprints/ePrint = 50 points baseline.
const VENUE_RANKINGS = {
  // Tier 1 - Top cryptography venues
  'CRYPTO': 100,
  'EUROCRYPT': 100,
  'Journal of Cryptology': 100,
  
  // Premier venues and IACR Transactions (hybrid venues)
  'ASIACRYPT': 95,
  'IACR Trans. Symmetric Cryptol.': 95,
  'IACR Trans. Cryptogr. Hardw. Embed. Syst.': 95,
  'IEEE Symposium on Security and Privacy': 95,
  'ACM Conference on Computer and Communications Security': 95,
  'S&P': 95,
  'CCS': 95,
  
  // High quality venues (equivalent to IACR Trans)
  'FSE': 90,  // Same as IACR Trans. Symmetric Cryptol.
  'CHES': 90, // Same as IACR Trans. Cryptogr. Hardw. Embed. Syst.
  'TCC': 90,
  'NDSS': 90,
  
  // Quality venues
  'PKC': 85,
  'IEEE Transactions on Information Forensics and Security': 85,
  'IEEE Computer': 85,
  
  // Solid venues
  'ACNS': 75,
  'CT-RSA': 75,
  'ACISP': 70,
  'INDOCRYPT': 70,
  'SAC': 70,
  'LATINCRYPT': 65,
  'AFRICACRYPT': 65,
  
  // Security venues
  'USENIX Security': 95,
  
  // Workshops and others
  'IACR Cryptol. ePrint Arch.': 50,
  'IACR Communications in Cryptology': 60,
  
  // Default scoring for unknown venues
  'default': 40
};

/**
 * Determine publication type based on venue
 * Note: IACR Transactions are hybrid venues (both journal and conference)
 * FSE ≡ IACR Trans. Symmetric Cryptol.
 * CHES ≡ IACR Trans. Cryptogr. Hardw. Embed. Syst.
 */
function getPublicationType(venue, type) {
  if (!venue) return 'article';
  
  const venueUpper = venue.toUpperCase();
  
  // Handle hybrid venues (IACR Transactions and their conference equivalents)
  if (venueUpper.includes('IACR TRANS')) return 'hybrid';
  if (venueUpper.includes('FSE') && venueUpper.includes('FAST SOFTWARE')) return 'hybrid';
  if (venueUpper.includes('CHES') && venueUpper.includes('CRYPTOGRAPHIC HARDWARE')) return 'hybrid';
  
  if (venueUpper.includes('JOURNAL') || venueUpper.includes('TRANS')) return 'journal';
  if (venueUpper.includes('WORKSHOP') || venueUpper.includes('WS')) return 'workshop';
  if (venueUpper.includes('EPRINT') || venueUpper.includes('PREPRINT') || venueUpper.includes('ARXIV')) return 'preprint';
  if (type && type.toLowerCase().includes('informal')) return 'preprint';
  
  return 'conference';
}

/**
 * Get venue prestige score with equivalency handling
 */
function getVenueScore(venue) {
  if (!venue) return 0;
  
  // Direct match
  if (VENUE_RANKINGS[venue]) {
    return VENUE_RANKINGS[venue];
  }
  
  // Handle venue equivalencies
  const venueUpper = venue.toUpperCase();
  
  // FSE = IACR Trans. Symmetric Cryptol.
  if (venueUpper.includes('FSE') || venueUpper.includes('IACR TRANS. SYMMETRIC CRYPTOL')) {
    return 90;
  }
  
  // CHES = IACR Trans. Cryptogr. Hardw. Embed. Syst.
  if (venueUpper.includes('CHES') || venueUpper.includes('IACR TRANS. CRYPTOGR. HARDW. EMBED. SYST')) {
    return 90;
  }
  
  // Partial matching for venue names
  for (const [venueKey, score] of Object.entries(VENUE_RANKINGS)) {
    if (venueKey !== 'default' && venueUpper.includes(venueKey.toUpperCase())) {
      return score;
    }
  }
  
  // Special patterns
  if (venueUpper.includes('CRYPTO')) return 100;
  if (venueUpper.includes('EUROCRYPT')) return 100;
  if (venueUpper.includes('ASIACRYPT')) return 95;
  if (venueUpper.includes('IACR TRANS')) return 95;
  if (venueUpper.includes('IEEE')) return 80;
  if (venueUpper.includes('ACM')) return 75;
  if (venueUpper.includes('SPRINGER')) return 70;
  if (venueUpper.includes('EPRINT') || venueUpper.includes('PREPRINT')) return 50;
  
  return VENUE_RANKINGS.default;
}

/**
 * Highlight author name in publication
 */
function highlightAuthorName(authors) {
  const authorName = 'Hosein Hadipour';
  const regex = new RegExp(`\\b${authorName}\\b`, 'gi');
  return authors.replace(regex, `<strong class="underline font-bold">${authorName}</strong>`);
}

/**
 * Fetch publications from DBLP
 */
async function fetchDBLPPublications() {
  try {
    console.log('Fetching publications from DBLP...');
    
    const response = await fetch(`${DBLP_API}?q=author%3A${encodeURIComponent(AUTHOR_NAME)}&format=json&h=100`, {
      headers: {
        'User-Agent': 'Academic-Website-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DBLP API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const publications = data.result?.hits?.hit || [];
    
    console.log(`Found ${publications.length} publications from DBLP`);
    
    return publications.map(hit => {
      const info = hit.info;
      const venue = info.venue || 'Unknown Venue';
      const year = parseInt(info.year) || 2024;
      const type = getPublicationType(venue, info.type);
      const prestigeScore = getVenueScore(venue);
      
      // Process authors
      let authors = 'Unknown Author';
      if (info.authors?.author) {
        if (Array.isArray(info.authors.author)) {
          authors = info.authors.author
            .map(a => typeof a === 'string' ? a : a.text)
            .join(', ');
        } else {
          authors = typeof info.authors.author === 'string' 
            ? info.authors.author 
            : info.authors.author.text;
        }
      }
      
      return {
        title: info.title || 'Untitled',
        authors: authors,
        venue: venue,
        year: year,
        url: info.ee || info.url || '',
        doi: info.doi || '',
        type: type,
        prestigeScore: prestigeScore,
        pages: info.pages || '',
        volume: info.volume || '',
        number: info.number || ''
      };
    });
    
  } catch (error) {
    console.error('Error fetching DBLP publications:', error.message);
    return [];
  }
}

/**
 * Calculate publication statistics with hybrid venue handling
 */
function calculateStatistics(publications) {
  const totalPubs = publications.length;
  let journalCount = 0;
  let conferenceCount = 0;
  let hybridCount = 0;
  const years = new Set();
  
  publications.forEach(pub => {
    years.add(pub.year);
    switch(pub.type) {
      case 'journal':
        journalCount++;
        break;
      case 'conference':
        conferenceCount++;
        break;
      case 'hybrid':
        hybridCount++;
        // Count hybrid as both journal and conference for statistics
        journalCount++;
        conferenceCount++;
        break;
    }
  });
  
  const topPub = publications.reduce((max, pub) => 
    pub.prestigeScore > max.prestigeScore ? pub : max, 
    publications[0] || { prestigeScore: 0 }
  );
  
  return {
    total: totalPubs,
    journals: journalCount,
    conferences: conferenceCount,
    hybrids: hybridCount,
    years: years.size,
    topPublication: topPub
  };
}

/**
 * Generate featured publication card HTML (without prestige score display)
 */
function generateFeaturedCard(pub, index) {
  const gradient = 'from-emerald-600 to-blue-600';
  
  const typeColors = {
    'journal': 'bg-blue-100 text-blue-800',
    'conference': 'bg-green-100 text-green-800',
    'hybrid': 'bg-purple-100 text-purple-800',
    'workshop': 'bg-yellow-100 text-yellow-800',
    'preprint': 'bg-gray-100 text-gray-800'
  };
  
  const typeColor = typeColors[pub.type] || typeColors['conference'];
  const authors = pub.authors.length > 100 ? pub.authors.substring(0, 100) + '...' : pub.authors;
  const highlightedAuthors = highlightAuthorName(authors);
  
  return `      <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-1 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        <div class="h-full rounded-xl bg-base-100 p-6 transition-all duration-300 group-hover:bg-opacity-95">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-bold mb-2 transition-all duration-300 line-clamp-2">
                ${pub.title}
              </h3>
              <p class="text-sm opacity-80 mb-3 line-clamp-2">
                ${highlightedAuthors}
              </p>
            </div>
            <div class="ml-4 flex flex-col items-end space-y-2">
              <span class="px-2 py-1 rounded-full text-xs ${typeColor} font-medium whitespace-nowrap">
                ${pub.type.charAt(0).toUpperCase() + pub.type.slice(1)}
              </span>
              <span class="text-lg font-bold text-gray-600">
                ${pub.year}
              </span>
            </div>
          </div>
          
          <div class="mb-4">
            <p class="text-sm font-medium text-gray-700 mb-1">
              ${pub.venue}
            </p>
            ${pub.volume ? `<p class="text-xs text-gray-500">Vol. ${pub.volume}${pub.number ? `, No. ${pub.number}` : ''}${pub.pages ? `, pp. ${pub.pages}` : ''}</p>` : ''}
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              ${pub.doi ? `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">DOI</span>` : ''}
            </div>
            ${pub.url ? `<a href="${pub.url}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-300">
              View Paper →
            </a>` : ''}
          </div>
        </div>
      </div>`;
}

/**
 * Generate publication card HTML (without prestige score display)
 */
function generatePublicationCard(pub, index) {
  const typeColors = {
    'journal': 'badge-primary',
    'conference': 'badge-secondary',
    'hybrid': 'badge-accent',
    'workshop': 'badge-warning',
    'preprint': 'badge-info'
  };
  
  const typeColor = typeColors[pub.type] || typeColors['conference'];
  const authors = pub.authors.length > 150 ? pub.authors.substring(0, 150) + '...' : pub.authors;
  const highlightedAuthors = highlightAuthorName(authors);
  
  return `      <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300" 
           data-publication 
           data-title="${pub.title.replace(/"/g, '&quot;')}" 
           data-authors="${pub.authors.replace(/"/g, '&quot;')}" 
           data-venue="${pub.venue.replace(/"/g, '&quot;')}" 
           data-year="${pub.year}" 
           data-type="${pub.type}">
        <div class="card-body p-6">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h3 class="card-title text-lg mb-2 line-clamp-2">
                ${pub.title}
              </h3>
              <p class="text-sm text-base-content/70 mb-2 line-clamp-1">
                ${highlightedAuthors}
              </p>
            </div>
            <div class="ml-4 text-right">
              <span class="badge ${typeColor} badge-sm mb-1 whitespace-nowrap">${pub.type}</span>
              <div class="text-sm font-medium">${pub.year}</div>
            </div>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-medium text-base-content/80">
              ${pub.venue}
            </p>
            ${pub.volume ? `<p class="text-xs text-base-content/60">Vol. ${pub.volume}${pub.number ? `, No. ${pub.number}` : ''}${pub.pages ? `, pp. ${pub.pages}` : ''}</p>` : ''}
          </div>
          
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              ${pub.doi ? `<span class="badge badge-outline badge-xs">DOI</span>` : ''}
            </div>
            ${pub.url ? `<a href="${pub.url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="btn btn-primary btn-xs">
              View →
            </a>` : ''}
          </div>
        </div>
      </div>`;
}

/**
 * Update the publications page
 */
async function updatePublicationsPage(publications) {
  try {
    const filePath = path.join(process.cwd(), 'src/pages/papers.astro');
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Sort publications by prestige score and year
    const sortedPubs = publications.sort((a, b) => {
      if (b.prestigeScore !== a.prestigeScore) {
        return b.prestigeScore - a.prestigeScore;
      }
      return b.year - a.year;
    });
    
    // Get top 6 for featured section
    const featuredPubs = sortedPubs.slice(0, 6);
    
    // Calculate statistics
    const stats = calculateStatistics(publications);
    
    // Generate HTML
    const featuredHTML = featuredPubs.map((pub, index) => generateFeaturedCard(pub, index)).join('\n');
    const allHTML = sortedPubs.map((pub, index) => generatePublicationCard(pub, index)).join('\n');
    
    // Update statistics in header using data attributes to preserve layout markup
    const statKeys = [
      { key: 'total', value: stats.total },
      { key: 'journals', value: stats.journals },
      { key: 'conferences', value: stats.conferences },
      { key: 'years', value: stats.years }
    ];

    statKeys.forEach(({ key, value }) => {
      const regex = new RegExp(`(data-stat=['"]${key}['"]>\\s*)\\d+(\\s*</div>)`);
      content = content.replace(regex, `$1${value}$2`);
    });
    
    // Replace featured publications section
    const featuredStart = content.indexOf('<!-- FEATURED_PUBLICATIONS_START -->');
    const featuredEnd = content.indexOf('<!-- FEATURED_PUBLICATIONS_END -->');
    
    if (featuredStart !== -1 && featuredEnd !== -1) {
      const before = content.substring(0, featuredStart + '<!-- FEATURED_PUBLICATIONS_START -->'.length);
      const after = content.substring(featuredEnd);
      content = before + '\n' + featuredHTML + '\n      ' + after;
    }
    
    // Replace all publications section
    const allStart = content.indexOf('<!-- ALL_PUBLICATIONS_START -->');
    const allEnd = content.indexOf('<!-- ALL_PUBLICATIONS_END -->');
    
    if (allStart !== -1 && allEnd !== -1) {
      const before = content.substring(0, allStart + '<!-- ALL_PUBLICATIONS_START -->'.length);
      const after = content.substring(allEnd);
      content = before + '\n' + allHTML + '\n      ' + after;
    }
    
    await fs.writeFile(filePath, content);
    
    // Write publications data as JSON for use in CV and other pages
    const publicationsDataPath = path.join(process.cwd(), 'src', 'data', 'publications.json');
    const publicationsData = {
      lastUpdated: new Date().toISOString(),
      statistics: stats,
      publications: publications.map(pub => ({
        title: pub.title,
        authors: pub.authors,
        venue: pub.venue,
        year: pub.year,
        url: pub.url,
        doi: pub.doi,
        type: pub.type,
        prestigeScore: pub.prestigeScore
      }))
    };
    
    await fs.writeFile(publicationsDataPath, JSON.stringify(publicationsData, null, 2));
    
    console.log(`Updated featured publications (${featuredPubs.length} publications)`);
    console.log(`Updated all publications (${publications.length} publications)`);
    console.log('Publications page updated successfully');
    console.log(`Publications data exported to ${publicationsDataPath}`);
    
    return stats;
    
  } catch (error) {
    console.error('Error updating publications page:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting publications update...');
    
    const publications = await fetchDBLPPublications();
    
    if (publications.length === 0) {
      console.log('No publications found');
      return;
    }
    
    const stats = await updatePublicationsPage(publications);
    
    // Find top publication
    const topPub = publications.reduce((max, pub) => 
      pub.prestigeScore > max.prestigeScore ? pub : max
    );
    
    console.log('\nSummary:');
    console.log(`- Total publications: ${stats.total}`);
    console.log(`- Journal papers: ${stats.journals}`);
    console.log(`- Conference papers: ${stats.conferences}`);
    if (stats.hybrids > 0) {
      console.log(`- Hybrid venues (IACR Trans): ${stats.hybrids}`);
    }
    console.log(`- Years active: ${stats.years}`);
    console.log(`- Top publication: "${topPub.title}" (${topPub.venue}, ${topPub.year})`);
    console.log(`- Top venue prestige score: ${topPub.prestigeScore}/100`);
    
    console.log('\nVenue Equivalencies Applied:');
    console.log('- FSE ≡ IACR Trans. Symmetric Cryptol. (90 pts)');
    console.log('- CHES ≡ IACR Trans. Cryptogr. Hardw. Embed. Syst. (90 pts)');
    console.log('- IACR Transactions counted as hybrid (both journal and conference)');
    console.log('- Prestige scores removed from public display');
    console.log('- Author name highlighting: Your name appears bold and underlined');
    
    console.log('\nPublications update completed!');
    
  } catch (error) {
    console.error('Error in main execution:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
