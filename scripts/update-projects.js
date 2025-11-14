#!/usr/bin/env node

/**
 * Clean Projects Updater
 * Fetches GitHub repositories and updates the projects page with:
 * 1. Featured Projects (top 6 by stars)
 * 2. All Projects archive
 */

import fs from 'fs/promises';
import path from 'path';
import { getGitHubHeaders } from './lib/api-utils.js';

const GITHUB_API = 'https://api.github.com';
const USERNAME = 'hadipourh';

// Repositories to exclude
const EXCLUDED_REPOS = ['mywebsite', 'hadipourh'];

/**
 * Fetch user repositories
 */
async function fetchRepositories() {
  try {
    console.log('Fetching repositories...');
    
    const response = await fetch(`${GITHUB_API}/users/${USERNAME}/repos?type=owner&sort=stargazers&direction=desc&per_page=100`, {
      headers: getGitHubHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('Rate limit reached. Try setting GITHUB_TOKEN environment variable.');
      }
      throw new Error(`GitHub API failed: ${response.status}`);
    }
    
    const repos = await response.json();
    
    // Filter repositories
    const filtered = repos.filter(repo => 
      !repo.fork && 
      !repo.archived && 
      !EXCLUDED_REPOS.includes(repo.name)
    );
    
    console.log(`Found ${filtered.length} repositories`);
    return filtered;
    
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    return [];
  }
}

/**
 * Fetch pull requests made by the user across GitHub
 */
async function fetchPullRequests() {
  try {
    console.log('Fetching pull requests...');
    
    const response = await fetch(`${GITHUB_API}/search/issues?q=author:${USERNAME}+type:pr&per_page=100&sort=updated`, {
      headers: getGitHubHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('Rate limit reached for pull requests.');
      }
      throw new Error(`GitHub API failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.total_count} pull requests`);
    
    return data.items;
    
  } catch (error) {
    console.error('Error fetching pull requests:', error.message);
    return [];
  }
}

/**
 * Extract unique repositories from pull requests
 */
function extractCollaborativeRepos(pullRequests) {
  // Projects to exclude from collaborative section
  const excludedProjects = ['course-cryptanalysis', 'sandbox'];
  
  const repoMap = new Map();
  
  pullRequests.forEach(pr => {
    const repoUrl = pr.repository_url;
    const repoFullName = repoUrl.replace(`${GITHUB_API}/repos/`, '');
    const [owner, name] = repoFullName.split('/');
    
    // Skip own repositories
    if (owner === USERNAME) {
      return;
    }
    
    // Skip excluded projects
    if (excludedProjects.includes(name)) {
      return;
    }
    
    const key = repoFullName;
    if (!repoMap.has(key)) {
      repoMap.set(key, {
        owner,
        name,
        fullName: repoFullName,
        url: pr.html_url.replace(/\/pull\/\d+$/, ''), // Remove PR number to get repo URL
        pullRequests: []
      });
    }
    
    repoMap.get(key).pullRequests.push({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      url: pr.html_url,
      created: pr.created_at
    });
  });
  
  return Array.from(repoMap.values());
}

/**
 * Enrich collaborative repositories with GitHub data
 */
async function enrichCollaborativeRepos(collaborativeRepos) {
  const enriched = [];
  
  for (const repo of collaborativeRepos.slice(0, 10)) { // Limit to avoid rate limits
    try {
      const response = await fetch(`${GITHUB_API}/repos/${repo.fullName}`, {
        headers: getGitHubHeaders()
      });
      
      if (response.ok) {
        const repoData = await response.json();
        enriched.push({
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description || 'No description available',
          stars: repoData.stargazers_count || 0,
          forks: repoData.forks_count || 0,
          language: repoData.language || 'Unknown',
          url: repoData.html_url,
          updated: repoData.updated_at,
          pullRequests: repo.pullRequests,
          owner: repo.owner
        });
      }
    } catch (error) {
      console.log(`Warning: Could not fetch details for ${repo.fullName}`);
    }
  }
  
  return enriched.sort((a, b) => b.pullRequests.length - a.pullRequests.length || b.stars - a.stars);
}

/**
 * Generate featured project card HTML
 */
function generateFeaturedCard(repo, index) {
  // Grid-style design with rotating colors
  const hoverTints = ['hover:bg-teal-600/10', 'hover:bg-cyan-600/10', 'hover:bg-emerald-600/10'];
  const borderColors = ['border-teal-600/20 hover:border-teal-600/40', 'border-cyan-600/20 hover:border-cyan-600/40', 'border-emerald-600/20 hover:border-emerald-600/40'];
  const colorIndex = index % 3;
  
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const description = repo.description || 'No description available';
  const language = repo.language || 'Unknown';
  
  return `      <div class="group relative overflow-hidden p-6 rounded-lg bg-base-200 ${hoverTints[colorIndex]} transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border ${borderColors[colorIndex]}">
        <div class="h-full">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-bold mb-2 transition-all duration-300">
                ${repo.name}
              </h3>
              <p class="text-sm opacity-80 mb-3 line-clamp-2">
                ${description}
              </p>
            </div>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-4">
              <span class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>${stars}</span>
              </span>
              <span class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span>${forks}</span>
              </span>
              <span class="px-2 py-1 rounded-full text-xs bg-opacity-20 bg-white">
                ${language}
              </span>
            </div>
            <a href="${repo.html_url}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300">
              View →
            </a>
          </div>
        </div>
      </div>`;
}

/**
 * Generate regular project card HTML
 */
function generateProjectCard(repo, index) {
  // Grid-style design with rotating colors
  const hoverTints = ['hover:bg-teal-600/10', 'hover:bg-cyan-600/10', 'hover:bg-emerald-600/10'];
  const borderColors = ['border-teal-600/20 hover:border-teal-600/40', 'border-cyan-600/20 hover:border-cyan-600/40', 'border-emerald-600/20 hover:border-emerald-600/40'];
  const colorIndex = index % 3;
  
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const description = repo.description || 'No description available';
  const language = repo.language || 'Unknown';
  const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return `      <div class="group relative overflow-hidden p-5 rounded-lg bg-base-200 ${hoverTints[colorIndex]} transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border ${borderColors[colorIndex]}">
        <div class="h-full">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-semibold transition-all duration-300">
              ${repo.name}
            </h3>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <span class="flex items-center space-x-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>${stars}</span>
              </span>
              <span class="flex items-center space-x-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span>${forks}</span>
              </span>
            </div>
          </div>
          
          <p class="text-sm opacity-80 mb-3 line-clamp-2">
            ${description}
          </p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 rounded-full text-xs bg-opacity-20 bg-white">
                ${language}
              </span>
              <span class="text-xs text-gray-500">Updated ${updatedDate}</span>
            </div>
            <a href="${repo.html_url}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-300">
              View →
            </a>
          </div>
        </div>
      </div>`;
}

/**
 * Generate collaborative project card HTML
 */
function generateCollaborativeCard(repo, index) {
  // Grid-style design with rotating colors
  const hoverTints = ['hover:bg-teal-600/10', 'hover:bg-cyan-600/10', 'hover:bg-emerald-600/10'];
  const borderColors = ['border-teal-600/20 hover:border-teal-600/40', 'border-cyan-600/20 hover:border-cyan-600/40', 'border-emerald-600/20 hover:border-emerald-600/40'];
  const colorIndex = index % 3;
  
  const stars = repo.stars || 0;
  const forks = repo.forks || 0;
  const description = repo.description || 'No description available';
  const language = repo.language || 'Unknown';
  const prCount = repo.pullRequests.length;
  const updatedDate = new Date(repo.updated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return `      <div class="group relative overflow-hidden p-5 rounded-lg bg-base-200 ${hoverTints[colorIndex]} transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border ${borderColors[colorIndex]}">
        <div class="h-full">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="text-lg font-semibold transition-all duration-300 mb-1">
                ${repo.name}
              </h3>
              <p class="text-xs text-gray-500 mb-2">by ${repo.owner}</p>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <span class="flex items-center space-x-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>${stars}</span>
              </span>
              <span class="flex items-center space-x-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 717 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span>${forks}</span>
              </span>
            </div>
          </div>
          
          <p class="text-sm opacity-80 mb-3 line-clamp-2">
            ${description}
          </p>
          
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 rounded-full text-xs bg-opacity-20 bg-white">
                ${language}
              </span>
              <span class="text-xs text-gray-500">Updated ${updatedDate}</span>
            </div>
            <span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              ${prCount} PR${prCount > 1 ? 's' : ''}
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-600">
              Contributed to ${repo.owner}/${repo.name}
            </div>
            <a href="${repo.url}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-300">
              View →
            </a>
          </div>
        </div>
      </div>`;
}

/**
 * Calculate project statistics
 */
function calculateStatistics(repositories, collaborativeRepos = []) {
  const totalProjects = repositories.length;
  const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const languages = new Set(repositories.map(repo => repo.language).filter(lang => lang));
  const totalLanguages = languages.size;
  
  return {
    totalProjects,
    totalStars,
    totalLanguages,
    collaborativeProjects: collaborativeRepos.length
  };
}

/**
 * Update the projects page
 */
async function updateProjectsPage(repositories, collaborativeRepos = []) {
  try {
    const projectsPath = path.resolve('src/pages/projects.astro');
    let content = await fs.readFile(projectsPath, 'utf-8');
    
    // Sort repositories by stars (descending)
    const sortedRepos = repositories.sort((a, b) => b.stargazers_count - a.stargazers_count);
    
  // Calculate real statistics
  const stats = calculateStatistics(sortedRepos, collaborativeRepos);
  
  // Update statistics using data-stat attributes (similar to publications page)
  const statUpdates = [
    { key: 'projects', value: stats.totalProjects },
    { key: 'stars', value: stats.totalStars },
    { key: 'languages', value: stats.totalLanguages }
  ];
  
  statUpdates.forEach(({ key, value }) => {
    const regex = new RegExp(`(data-stat=['"]${key}['"]>)\\d+(</div>)`);
    content = content.replace(regex, `$1${value}$2`);
  });
  
  console.log(`Updated statistics: ${stats.totalProjects} projects, ${stats.totalStars} stars, ${stats.totalLanguages} languages`);    // Generate featured projects (top 9)
    const featuredRepos = sortedRepos.slice(0, 9);
    const featuredHTML = featuredRepos.map((repo, index) => generateFeaturedCard(repo, index)).join('\n');
    
    // Generate all projects archive
    const archiveHTML = sortedRepos.map((repo, index) => generateProjectCard(repo, index)).join('\n');
    
    // Update featured projects section
    const featuredRegex = /<!-- FEATURED_PROJECTS_START -->[\s\S]*?<!-- FEATURED_PROJECTS_END -->/;
    if (featuredRegex.test(content)) {
      content = content.replace(featuredRegex, 
        `<!-- FEATURED_PROJECTS_START -->\n${featuredHTML}\n    <!-- FEATURED_PROJECTS_END -->`
      );
      console.log(`Updated featured projects (${featuredRepos.length} projects)`);
    } else {
      console.log('Could not find FEATURED_PROJECTS markers');
    }
    
    // Update main projects archive section
    const archiveRegex = /<!-- MAIN_PROJECTS_START -->[\s\S]*?<!-- MAIN_PROJECTS_END -->/;
    if (archiveRegex.test(content)) {
      content = content.replace(archiveRegex, 
        `<!-- MAIN_PROJECTS_START -->\n${archiveHTML}\n      <!-- MAIN_PROJECTS_END -->`
      );
      console.log(`Updated projects archive (${sortedRepos.length} projects)`);
    } else {
      console.log('Could not find MAIN_PROJECTS markers');
    }
    
    // Update collaborative projects section
    if (collaborativeRepos.length > 0) {
      const collaborativeHTML = collaborativeRepos.map((repo, index) => generateCollaborativeCard(repo, index)).join('\n');
      const collaborativeRegex = /<!-- COLLABORATIVE_PROJECTS_START -->[\s\S]*?<!-- COLLABORATIVE_PROJECTS_END -->/;
      if (collaborativeRegex.test(content)) {
        content = content.replace(collaborativeRegex, 
          `<!-- COLLABORATIVE_PROJECTS_START -->\n${collaborativeHTML}\n        <!-- COLLABORATIVE_PROJECTS_END -->`
        );
        console.log(`Updated collaborative projects (${collaborativeRepos.length} projects)`);
      } else {
        console.log('Could not find COLLABORATIVE_PROJECTS markers');
      }
    } else {
      console.log('No collaborative projects found');
    }
    
    await fs.writeFile(projectsPath, content);
    console.log('Projects page updated successfully');
    
    // Summary
    console.log(`\nSummary:`);
    console.log(`- Total repositories: ${repositories.length}`);
    console.log(`- Featured projects: ${featuredRepos.length}`);
    console.log(`- Collaborative projects: ${collaborativeRepos.length}`);
    if (featuredRepos.length > 0) {
      console.log(`- Top project: ${featuredRepos[0].name} (${featuredRepos[0].stargazers_count} stars)`);
    }
    
  } catch (error) {
    console.error('Error updating projects page:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting projects update...');
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  if (GITHUB_TOKEN) {
    console.log('Using GitHub token (higher rate limits)');
  } else {
    console.log('No GitHub token set (limited rate limits)');
    console.log('  Set GITHUB_TOKEN environment variable to avoid rate limits');
  }
  
  // Fetch user's own repositories
  const repositories = await fetchRepositories();
  
  if (repositories.length === 0) {
    console.log('No repositories found. Check GitHub token or rate limits.');
    return;
  }
  
  // Fetch collaborative projects (pull requests)
  const pullRequests = await fetchPullRequests();
  const collaborativeRepos = extractCollaborativeRepos(pullRequests);
  const enrichedCollaborative = await enrichCollaborativeRepos(collaborativeRepos);
  
  await updateProjectsPage(repositories, enrichedCollaborative);
  console.log('\nProjects update completed!');
}

// Run the script
main().catch(console.error);
