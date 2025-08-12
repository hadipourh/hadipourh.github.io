#!/usr/bin/env node

/**
 * Auto-update publications from DBLP and Google Scholar
 * This script fetches the latest publications and updates src/data/cv.ts
 */

import fs from 'fs/promises';
import path from 'path';

const DBLP_API = 'https://dblp.org/search/publ/api';
const AUTHOR_NAME = 'Hosein Hadipour';

async function fetchDBLPPublications() {
  try {
    console.log('🔍 Fetching publications from DBLP...');
    
    const response = await fetch(`${DBLP_API}?q=author%3A${encodeURIComponent(AUTHOR_NAME)}&format=json&h=100`);
    
    if (!response.ok) {
      throw new Error(`DBLP API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const publications = data.result?.hits?.hit || [];
    
    console.log(`📚 Found ${publications.length} publications`);
    
    return publications.map(hit => {
      const info = hit.info;
      return {
        title: info.title || 'Untitled',
        authors: Array.isArray(info.authors?.author) 
          ? info.authors.author.map(a => typeof a === 'string' ? a : a.text).join(', ')
          : typeof info.authors?.author === 'string' 
            ? info.authors.author 
            : info.authors?.author?.text || 'Unknown Author',
        venue: info.venue || 'Unknown Venue',
        year: info.year || 'Unknown Year',
        url: info.url || '',
        doi: info.doi || '',
        type: info.type || 'article'
      };
    });
    
  } catch (error) {
    console.error('❌ Error fetching DBLP publications:', error.message);
    return [];
  }
}

async function updateCvFile(publications) {
  try {
    const cvPath = path.join(process.cwd(), 'src', 'data', 'cv.ts');
    const cvContent = await fs.readFile(cvPath, 'utf-8');
    
    // Extract existing publications section
    const publicationsStart = cvContent.indexOf('export const publications: Publication[] = [');
    const publicationsEnd = cvContent.indexOf('];', publicationsStart) + 2;
    
    if (publicationsStart === -1 || publicationsEnd === -1) {
      throw new Error('Could not find publications section in cv.ts');
    }
    
    // Generate new publications array
    const newPublications = publications.slice(0, 20).map(pub => `  {
    title: ${JSON.stringify(pub.title)},
    authors: ${JSON.stringify(pub.authors)},
    venue: ${JSON.stringify(pub.venue)},
    year: ${JSON.stringify(pub.year)},
    url: ${JSON.stringify(pub.url)},
    type: ${JSON.stringify(pub.type)}
  }`).join(',\n');
    
    const newPublicationsSection = `export const publications: Publication[] = [
${newPublications}
];`;
    
    // Replace the publications section
    const newCvContent = cvContent.substring(0, publicationsStart) + 
                        newPublicationsSection + 
                        cvContent.substring(publicationsEnd);
    
    await fs.writeFile(cvPath, newCvContent, 'utf-8');
    console.log('✅ Updated publications in cv.ts');
    
  } catch (error) {
    console.error('❌ Error updating cv.ts:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting publication update process...');
  
  const publications = await fetchDBLPPublications();
  
  if (publications.length > 0) {
    await updateCvFile(publications);
    console.log('🎉 Publication update completed!');
  } else {
    console.log('⚠️ No publications found, skipping update');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
