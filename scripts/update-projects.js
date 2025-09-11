#!/usr/bin/env node

/**
 * Auto-update projects from GitHub repositories
 * This script fetches project information and updates src/pages/projects.astro
 * Focus: Pull requests for contributions and collaborations
 */

import fs from 'fs/promises';
import path from 'path';

const GITHUB_API = 'https://api.github.com';
const USERNAME = 'hadipourh';

// GitHub token for API authentication (optional but recommended)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Helper function to get headers for GitHub API requests
function getGitHubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Academic-Website-Bot'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  return headers;
}

// Repositories to exclude from the projects page
const EXCLUDED_REPOS = [
  'mywebsite', // This website itself
  'hadipourh'  // Profile README
];

// Additional repositories to exclude from contributions section only
const EXCLUDED_CONTRIBUTIONS = [
  'sandbox',              // NRTC/sandbox
  'course-cryptanalysis'  // Ling-Song-000/course-cryptanalysis
];

/**
 * Fetch all pull requests created by the user across GitHub
 */
async function fetchUserPullRequests() {
  try {
    console.log('Fetching pull requests from GitHub...');
    
    const query = `author:${USERNAME} type:pr`;
    const response = await fetch(`${GITHUB_API}/search/issues?q=${encodeURIComponent(query)}&per_page=100&sort=updated`, {
      headers: getGitHubHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('WARNING: GitHub API rate limit reached. Consider setting GITHUB_TOKEN environment variable.');
        console.log('Rate limit info:', response.headers.get('x-ratelimit-remaining'), 'requests remaining');
      }
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.total_count} pull requests by ${USERNAME}`);
    
    return data.items;
  } catch (error) {
    console.error('Error fetching pull requests:', error.message);
    return [];
  }
}

/**
 * Extract unique repositories from pull requests
 */
function extractRepositoriesFromPRs(pullRequests) {
  const repoMap = new Map();
  
  pullRequests.forEach(pr => {
    const repoUrl = pr.repository_url;
    const repoFullName = repoUrl.replace(`${GITHUB_API}/repos/`, '');
    const [owner, name] = repoFullName.split('/');
    
    // Skip own repositories and excluded repos
    if (owner === USERNAME || EXCLUDED_REPOS.includes(name)) {
      return;
    }
    
    // Skip repositories excluded from contributions section
    if (EXCLUDED_CONTRIBUTIONS.includes(name.toLowerCase())) {
      return;
    }
    
    const key = repoFullName;
    if (!repoMap.has(key)) {
      repoMap.set(key, {
        owner,
        name,
        fullName: repoFullName,
        pullRequests: [],
        url: pr.html_url.replace(/\/pull\/\d+$/, '')
      });
    }
    
    repoMap.get(key).pullRequests.push({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at
    });
  });
  
  return Array.from(repoMap.values());
}

/**
 * Fetch additional repository information
 */
async function enrichRepositoryData(repositories) {
  console.log(`Fetching details for ${repositories.length} repositories...`);
  
  const enriched = [];
  
  for (const repo of repositories) {
    try {
      const response = await fetch(`${GITHUB_API}/repos/${repo.fullName}`, {
        headers: getGitHubHeaders()
      });
      
      if (response.ok) {
        const repoData = await response.json();
        enriched.push({
          ...repo,
          description: repoData.description || 'No description available',
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
          topics: repoData.topics || [],
          updated: repoData.updated_at
        });
        
        console.log(`Processed: ${repo.fullName} (${repo.pullRequests.length} PRs)`);
      } else {
        console.log(`Warning: Could not fetch details for ${repo.fullName}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`Warning: Error processing ${repo.fullName}: ${error.message}`);
    }
  }
  
  return enriched;
}

/**
 * Fetch user's own repositories
 */
async function fetchUserRepositories() {
  try {
    console.log('Fetching user repositories...');
    
    const response = await fetch(`${GITHUB_API}/users/${USERNAME}/repos?sort=updated&per_page=100`, {
      headers: getGitHubHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('WARNING: GitHub API rate limit reached for user repositories.');
        console.log('Rate limit info:', response.headers.get('x-ratelimit-remaining'), 'requests remaining');
      }
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }
    
    const repos = await response.json();
    
    // Filter for original work (non-forks, non-excluded)
    const originalRepos = repos
      .filter(repo => !repo.fork && !repo.private && !EXCLUDED_REPOS.includes(repo.name))
      .sort((a, b) => {
        if (a.stargazers_count !== b.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
      })
      .map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || 'No description available',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        url: repo.html_url,
        topics: repo.topics || [],
        updated: repo.updated_at,
        fork: false
      }));
    
    console.log(`Found ${originalRepos.length} original repositories`);
    return originalRepos;
  } catch (error) {
    console.error('Error fetching user repositories:', error.message);
    return [];
  }
}

/**
 * Main function to fetch all projects data
 */
async function fetchProjectsFromGitHub() {
  try {
    const [userRepos, pullRequests] = await Promise.all([
      fetchUserRepositories(),
      fetchUserPullRequests()
    ]);
    
    const contributionRepos = extractRepositoriesFromPRs(pullRequests);
    const enrichedContributions = await enrichRepositoryData(contributionRepos);
    
    // Sort contributions by stars and recency
    enrichedContributions.sort((a, b) => {
      if (a.stars !== b.stars) {
        return b.stars - a.stars;
      }
      return new Date(b.updated) - new Date(a.updated);
    });
    
    console.log(`Summary: ${userRepos.length} original repos, ${enrichedContributions.length} contributions`);
    
    return {
      original: userRepos,
      contributions: enrichedContributions
    };
  } catch (error) {
    console.error('Error fetching projects from GitHub:', error.message);
    return { original: [], contributions: [] };
  }
}

function generateProjectCard(project) {
  const truncatedDescription = truncateText(project.description, 80);
  
  // Simple, dynamic project type based on characteristics
  let projectType = 'Research Tool';
  if (project.topics.includes('education') || project.name.includes('course')) {
    projectType = 'Educational Resource';
  } else if (project.name.includes('talks') || project.name.includes('presentation')) {
    projectType = 'Presentation Templates';
  }
  
  return `			<div class='card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow'>
				<div class='card-body'>
					<h2 class='card-title text-lg'>
						${formatProjectName(project.name)}
					</h2>
					<p class='text-sm'>${truncatedDescription}</p>
					<div class='flex flex-wrap gap-2 mt-3 mb-2'>
						<div class='badge badge-primary'>${project.stars} stars</div>
						<div class='badge badge-outline'>${truncateText(project.language || 'Mixed', 10)}</div>
						${project.topics.slice(0, 2).map(topic => 
							`<div class='badge badge-outline'>${truncateText(formatTopic(topic), 12)}</div>`
						).join('')}
					</div>
					<div class='card-actions justify-between items-end'>
						<div class='text-xs text-gray-500 flex-1'>${projectType}</div>
						<a href='${project.url}' target='_blank' class='btn btn-primary btn-sm whitespace-nowrap'>View Code</a>
					</div>
				</div>
			</div>`;
}

function generateContributionCard(project) {
  const truncatedDescription = truncateText(project.description, 70);
  
  // Show pull request count prominently for contributions
  const prInfo = project.pullRequests ? 
    `<span class="badge badge-secondary badge-sm">${project.pullRequests.length} PR${project.pullRequests.length !== 1 ? 's' : ''}</span>` : '';
  
  return `			<div class='card bg-base-100 shadow-md hover:shadow-lg transition-shadow'>
				<div class='card-body p-4'>
					<h3 class='card-title text-base'>
						${formatProjectName(project.name)}
						${prInfo}
					</h3>
					<p class='text-sm text-gray-600 mb-3'>${truncatedDescription}</p>
					<div class='flex flex-wrap gap-2 mb-3'>
						<div class='badge badge-sm badge-primary'>${project.stars} stars</div>
						<div class='badge badge-sm badge-outline'>${truncateText(project.language || 'Mixed', 8)}</div>
						${project.topics.slice(0, 1).map(topic => 
							`<div class='badge badge-sm badge-outline'>${truncateText(formatTopic(topic), 10)}</div>`
						).join('')}
					</div>
					<div class='flex justify-between items-center'>
						<div class='text-xs text-gray-500'>Collaboration</div>
						<a href='${project.url}' target='_blank' class='btn btn-primary btn-xs'>View Project</a>
					</div>
				</div>
			</div>`;
}

function formatProjectName(name) {
  // Convert kebab-case to Title Case
  return name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatTopic(topic) {
  return topic.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

async function updateProjectsPage(projectData) {
  try {
    const projectsPath = path.join(process.cwd(), 'src', 'pages', 'projects.astro');
    let content = await fs.readFile(projectsPath, 'utf-8');
    
    // Generate main projects (your original repositories)
    const mainProjectCards = projectData.original.map(generateProjectCard).join('\n\n');
    
    // Generate contributions section with compact cards
    const contributionCards = projectData.contributions.map(project => 
      generateContributionCard(project)
    ).join('\n\n');
    
    // Find the start of the main projects section
    const mainProjectsStart = content.indexOf('<h2 class=\'text-2xl font-bold mb-6\'>My Projects</h2>');
    const mainGridStart = content.indexOf('<div class=\'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12\'>', mainProjectsStart);
    
    // Find the contributions section
    const contributionsStart = content.indexOf('<h2 class=\'text-2xl font-bold mb-6\'>Contributions & Collaborations</h2>');
    const contributionsGridStart = content.indexOf('<div class=\'grid grid-cols-1 md:grid-cols-2 gap-4\'>', contributionsStart);
    const contributionsEnd = content.indexOf('</div>', contributionsGridStart) + 6; // Include the closing </div>
    const sectionEnd = content.indexOf('</section>', contributionsEnd);
    
    if (mainProjectsStart !== -1 && sectionEnd !== -1) {
      const beforeContent = content.substring(0, mainProjectsStart);
      const afterContent = content.substring(sectionEnd);
      
      const newContent = `<h2 class='text-2xl font-bold mb-6'>My Projects</h2>
		<div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
${mainProjectCards}
		</div>

		<h2 class='text-2xl font-bold mb-6'>Contributions & Collaborations</h2>
		<div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
${contributionCards}
		</div>
	</section>`;
      
      content = beforeContent + newContent + afterContent;
    } else {
      console.log('ERROR: Could not find section boundaries, content not updated');
      console.log('Main projects start:', mainProjectsStart);
      console.log('Section end:', sectionEnd);
    }
    
    await fs.writeFile(projectsPath, content, 'utf-8');
    console.log('SUCCESS: Updated projects.astro');
    
  } catch (error) {
    console.error('ERROR: Error updating projects.astro:', error.message);
  }
}

async function main() {
  console.log('Starting projects update process...');
  
  // Show authentication status
  if (GITHUB_TOKEN) {
    console.log('✓ Using GitHub token authentication (higher rate limits)');
  } else {
    console.log('⚠ No GitHub token found. Using unauthenticated requests (lower rate limits)');
    console.log('  To avoid rate limits, set GITHUB_TOKEN environment variable');
  }
  
  const projectData = await fetchProjectsFromGitHub();
  
  if (projectData.original.length > 0 || projectData.contributions.length > 0) {
    await updateProjectsPage(projectData);
    console.log(`Projects update completed! Updated ${projectData.original.length} main projects and ${projectData.contributions.length} contributions`);
  } else {
    console.log('WARNING: No projects found, skipping update');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
