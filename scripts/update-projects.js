#!/usr/bin/env node

/**
 * Auto-update projects from GitHub repositories
 * This script fetches project information and updates src/pages/projects.astro
 */

import fs from 'fs/promises';
import path from 'path';

const GITHUB_API = 'https://api.github.com';
const USERNAME = 'hadipourh';

// Repositories to exclude from the projects page (minor utilities, meta repos, etc.)
const EXCLUDED_REPOS = [
  'mywebsite', // This website itself
  'hadipourh'  // Profile README
];

// Notable organization contributions to highlight
const ORGANIZATION_CONTRIBUTIONS = [
  {
    name: 'SageMath',
    originalRepo: 'sagemath',
    description: 'Mathematical software system'
  },
  {
    name: 'Cryptography.io',
    originalRepo: 'cryptography',
    description: 'Python cryptographic library'
  },
  {
    name: 'OpenSSL',
    originalRepo: 'openssl',
    description: 'Cryptographic toolkit'
  }
];

async function checkActualContribution(repo) {
  try {
    // For specific repositories we know you've contributed to, always include them
    const knownContributions = [
      'cryptosmt', 
      'boolector', 
      'sec-deadlines.github.io', 
      'info-sec-contacts',
      'aes-attacks-finder'  // You mentioned contributing to this
    ];
    
    if (knownContributions.includes(repo.name.toLowerCase())) {
      console.log(`✅ Including known contribution: ${repo.name}`);
      return true;
    }
    
    // Try to determine the original repository
    let originalOwner, originalRepo;
    
    if (repo.parent) {
      // If parent is available, use it
      originalOwner = repo.parent.owner.login;
      originalRepo = repo.parent.name;
    } else {
      // If no parent info, we could try to guess but for now skip unknown repos
      // unless they're in our known contributions list
      console.log(`⚠️ No parent found for ${repo.name}, not in known contributions list`);
      return false;
    }
    
    console.log(`🔍 Checking contributions to ${originalOwner}/${originalRepo}...`);
    
    const [pullsResponse, issuesResponse] = await Promise.all([
      // Check for pull requests (open, closed, merged)
      fetch(`${GITHUB_API}/repos/${originalOwner}/${originalRepo}/pulls?creator=${USERNAME}&state=all&per_page=10`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Academic-Website-Bot'
        }
      }),
      // Check for issues created
      fetch(`${GITHUB_API}/repos/${originalOwner}/${originalRepo}/issues?creator=${USERNAME}&state=all&per_page=10`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Academic-Website-Bot'
        }
      })
    ]);
    
    if (pullsResponse.ok && issuesResponse.ok) {
      const pulls = await pullsResponse.json();
      const issues = await issuesResponse.json();
      
      // Log what we found for debugging
      if (pulls.length > 0) {
        console.log(`✅ Found ${pulls.length} pull request(s) to ${originalOwner}/${originalRepo}`);
        pulls.forEach(pr => console.log(`  - PR #${pr.number}: ${pr.title} (${pr.state})`));
      }
      if (issues.length > 0) {
        console.log(`✅ Found ${issues.length} issue(s) in ${originalOwner}/${originalRepo}`);
      }
      
      // Return true if there are any PRs or issues
      return pulls.length > 0 || issues.length > 0;
    } else {
      console.log(`❌ Failed to check ${originalOwner}/${originalRepo}: ${pullsResponse.status}, ${issuesResponse.status}`);
    }
    
    return false;
  } catch (error) {
    console.warn(`⚠️ Could not check contribution for ${repo.name}: ${error.message}`);
    return false;
  }
}

async function fetchProjectsFromGitHub() {
  try {
    console.log('🔍 Fetching projects from GitHub...');
    
    // Get user repositories
    const response = await fetch(`${GITHUB_API}/users/${USERNAME}/repos?sort=updated&per_page=100`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Academic-Website-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }
    
    const repos = await response.json();
    
    // Filter repositories - separate your work from contributions
    const allRepos = repos.filter(repo => {
      // Exclude private repos and meta repos
      if (repo.private || EXCLUDED_REPOS.includes(repo.name)) {
        return false;
      }
      return true;
    });

    // Separate into original work and contributions
    const originalRepos = allRepos
      .filter(repo => !repo.fork)
      .sort((a, b) => {
        // Sort original repos by star count, then by update date
        if (a.stargazers_count !== b.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

    // Filter for actual contributions (with API checks)
    const potentialContributions = allRepos.filter(repo => repo.fork);
    const contributions = [];
    
    console.log(`🔍 Checking ${potentialContributions.length} forks for actual contributions...`);
    
    for (const repo of potentialContributions) {
      // Check if this is a notable organization contribution
      const orgContribution = ORGANIZATION_CONTRIBUTIONS.find(org => 
        repo.full_name.toLowerCase().includes(org.originalRepo.toLowerCase()) || 
        repo.description?.toLowerCase().includes(org.originalRepo.toLowerCase())
      );
      
      // For organization contributions, always include (assuming they're meaningful)
      if (orgContribution) {
        contributions.push(repo);
        continue;
      }
      
      // For other forks, check for actual contribution activity
      const hasActualContribution = await checkActualContribution(repo);
      if (hasActualContribution) {
        contributions.push(repo);
      }
    }
    
    // Sort contributions by star count, then by update date
    contributions.sort((a, b) => {
      if (a.stargazers_count !== b.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    console.log(`📦 Found ${originalRepos.length} original repositories and ${contributions.length} contributions`);
    
    const mapRepo = (repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || 'No description available',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      url: repo.html_url,
      topics: repo.topics || [],
      updated: repo.updated_at,
      fork: repo.fork
    });

    return {
      original: originalRepos.map(mapRepo),
      contributions: contributions.map(mapRepo)
    };
    
  } catch (error) {
    console.error('❌ Error fetching projects from GitHub:', error.message);
    return [];
  }
}

function generateProjectCard(project) {
  const icon = getProjectIcon(project.name, project.topics);
  const badgeType = getLanguageBadge(project.language);
  const publicationType = getPublicationType(project.name);
  
  // Truncate description to prevent overflow
  const truncatedDescription = truncateText(project.description, 80);
  
  // Check if this is a contribution to a notable organization
  let orgContribution = null;
  if (project.fork) {
    orgContribution = ORGANIZATION_CONTRIBUTIONS.find(org => 
      project.fullName.toLowerCase().includes(org.originalRepo.toLowerCase()) || 
      project.description?.toLowerCase().includes(org.originalRepo.toLowerCase())
    );
  }
  
  const isContribution = project.fork || (project.fullName && 
    !project.fullName.startsWith('hadipourh/'));
  const contributionLabel = isContribution ? 'Contribution' : publicationType;
  
  return `			<div class='card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow'>
				<div class='card-body'>
					<h2 class='card-title text-lg'>
						${icon}
						${formatProjectName(project.name)}
						${orgContribution ? 
							`<span class="badge badge-secondary badge-sm ml-2">🌟 ${orgContribution.name}</span>` : 
							(isContribution ? '<span class="badge badge-info badge-sm ml-2">Contrib</span>' : '')
						}
					</h2>
					<p class='text-sm'>${truncatedDescription}</p>
					<div class='flex flex-wrap gap-2 mt-3 mb-2'>
						<div class='badge badge-primary'>★ ${project.stars}</div>
						<div class='badge badge-outline'>${truncateText(project.language || 'Mixed', 10)}</div>
						${project.topics.slice(0, 1).map(topic => 
							`<div class='badge badge-outline'>${truncateText(formatTopic(topic), 12)}</div>`
						).join('')}
					</div>
					<div class='card-actions justify-between items-end'>
						<div class='text-xs text-gray-500 flex-1'>${contributionLabel}</div>
						<a href='${project.url}' target='_blank' class='btn btn-primary btn-sm whitespace-nowrap'>Code</a>
					</div>
				</div>
			</div>`;
}

function generateContributionCard(project) {
  // Check if this is a contribution to a notable organization
  let orgContribution = null;
  if (project.fork) {
    orgContribution = ORGANIZATION_CONTRIBUTIONS.find(org => 
      project.fullName.toLowerCase().includes(org.originalRepo.toLowerCase()) || 
      project.description?.toLowerCase().includes(org.originalRepo.toLowerCase())
    );
  }
  
  // Truncate description for compact display
  const truncatedDescription = truncateText(project.description, 60);
  
  return `			<div class='card bg-base-100 shadow-md hover:shadow-lg transition-shadow'>
				<div class='card-body p-4'>
					<h3 class='text-sm font-semibold'>
						${formatProjectName(project.name)}
						${orgContribution ? 
							`<span class="badge badge-secondary badge-xs ml-2">🌟 ${orgContribution.name}</span>` : 
							'<span class="badge badge-info badge-xs ml-2">Fork</span>'
						}
					</h3>
					<p class='text-xs text-gray-600 mb-2'>${truncatedDescription}</p>
					<div class='flex justify-between items-center'>
						<div class='flex gap-2'>
							<div class='badge badge-xs'>★ ${project.stars}</div>
							<div class='badge badge-xs badge-outline'>${truncateText(project.language || 'Mixed', 8)}</div>
						</div>
						<a href='${project.url}' target='_blank' class='btn btn-xs btn-primary'>View</a>
					</div>
				</div>
			</div>`;
}

function getProjectIcon(name, topics) {
  const projectName = name.toLowerCase();
  
  // Educational resources - Book with bookmark
  if (projectName.includes('course') || topics.includes('education')) {
    return `<svg class="w-5 h-5" fill="#3B82F6" viewBox="0 0 24 24">
			<path d="M4 19.5A2.5 2.5 0 016.5 17H20a2 2 0 002-2V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15zM6.5 4H20v11H6.5a1 1 0 100 2H20v.5a.5.5 0 01-.5.5H6.5A1.5 1.5 0 015 16.5v-12A1.5 1.5 0 016.5 4z"/>
			<path d="M8 6h8v2H8V6zM8 9h8v2H8V9zM8 12h5v2H8v-2z"/>
		</svg>`;
  }
  
  // Autoguess - Brain with circuit
  if (projectName.includes('autoguess')) {
    return `<svg class="w-5 h-5" fill="#8B5CF6" viewBox="0 0 24 24">
			<path d="M9.5 2A5.5 5.5 0 004 7.5v1A5.5 5.5 0 009.5 14h.5a5.5 5.5 0 005.5-5.5v-1A5.5 5.5 0 0010 2H9.5z"/>
			<circle cx="7" cy="6" r="1"/>
			<circle cx="12" cy="6" r="1"/>
			<path d="M8 9c0 1.5 1 2.5 2 2.5s2-1 2-2.5M6 16h2v2H6v-2zM10 16h2v2h-2v-2zM14 16h2v2h-2v-2z"/>
		</svg>`;
  }
  
  // S-box analyzer - Matrix/Grid
  if (projectName.includes('sbox')) {
    return `<svg class="w-5 h-5" fill="#059669" viewBox="0 0 24 24">
			<path d="M3 3h4v4H3V3zM9 3h4v4H9V3zM15 3h4v4h-4V3zM3 9h4v4H3V9zM9 9h4v4H9V9zM15 9h4v4h-4V9zM3 15h4v4H3v-4zM9 15h4v4H9v-4zM15 15h4v4h-4v-4z"/>
			<circle cx="5" cy="5" r="0.5" fill="white"/>
			<circle cx="11" cy="11" r="0.5" fill="white"/>
			<circle cx="17" cy="17" r="0.5" fill="white"/>
		</svg>`;
  }
  
  // VHDL/Hardware - Microchip
  if (projectName.includes('vhdl') || projectName.includes('aes') && topics.includes('hardware')) {
    return `<svg class="w-5 h-5" fill="#DC2626" viewBox="0 0 24 24">
			<path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"/>
			<path d="M8 8h8v8H8V8z" fill="white"/>
			<path d="M10 10h4v4h-4v-4z" fill="#DC2626"/>
			<circle cx="4" cy="8" r="1" fill="#DC2626"/>
			<circle cx="4" cy="12" r="1" fill="#DC2626"/>
			<circle cx="4" cy="16" r="1" fill="#DC2626"/>
			<circle cx="20" cy="8" r="1" fill="#DC2626"/>
			<circle cx="20" cy="12" r="1" fill="#DC2626"/>
			<circle cx="20" cy="16" r="1" fill="#DC2626"/>
		</svg>`;
  }
  
  // KeeLoq - Key with lock
  if (projectName.includes('keeloq')) {
    return `<svg class="w-5 h-5" fill="#F59E0B" viewBox="0 0 24 24">
			<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
			<path d="M12 7a2 2 0 100 4 2 2 0 000-4z" fill="white"/>
			<path d="M12 13v4" stroke="white" stroke-width="2" stroke-linecap="round"/>
		</svg>`;
  }
  
  // Zero/Zeroplus - Target with crosshairs
  if (projectName.includes('zero')) {
    return `<svg class="w-5 h-5" fill="#EF4444" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="10"/>
			<circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="2"/>
			<circle cx="12" cy="12" r="2" fill="white"/>
			<path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" stroke-width="2"/>
		</svg>`;
  }
  
  // Boomerang attacks - Boomerang shape
  if (projectName.includes('boomerang')) {
    return `<svg class="w-5 h-5" fill="#F97316" viewBox="0 0 24 24">
			<path d="M3 12c0-2 2-4 5-4s5 2 5 4c0-2 2-4 5-4s5 2 5 4c0 2-2 4-5 4-1.5 0-3-.5-4-1.5C13.5 15.5 11.5 16 10 16c-3 0-5-2-5-4z"/>
			<circle cx="8" cy="12" r="1" fill="white"/>
			<circle cx="16" cy="12" r="1" fill="white"/>
		</svg>`;
  }
  
  // Talks/Presentations - Presentation screen
  if (projectName.includes('talks') || projectName.includes('presentation')) {
    return `<svg class="w-5 h-5" fill="#06B6D4" viewBox="0 0 24 24">
			<path d="M4 3a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H4z"/>
			<path d="M5 5h14v9H5V5z" fill="white"/>
			<path d="M7 7h6v2H7V7zM7 10h10v1H7v-1zM7 12h8v1H7v-1z" fill="#06B6D4"/>
			<path d="M11 16v2M8 18h8" stroke="#06B6D4" stroke-width="2"/>
		</svg>`;
  }
  
  // Logic minimization - Logic gates
  if (projectName.includes('logic') || projectName.includes('minimization')) {
    return `<svg class="w-5 h-5" fill="#7C3AED" viewBox="0 0 24 24">
			<path d="M2 6h4l2 3-2 3H2V6zM8 6h3c2 0 3 1 3 3s-1 3-3 3H8V6zM16 6h4v6h-4l-2-3 2-3z"/>
			<circle cx="6" cy="9" r="0.5" fill="white"/>
			<circle cx="11" cy="9" r="0.5" fill="white"/>
			<circle cx="18" cy="9" r="0.5" fill="white"/>
			<path d="M2 15h20" stroke="#7C3AED" stroke-width="1"/>
			<circle cx="12" cy="18" r="1" fill="#7C3AED"/>
		</svg>`;
  }
  
  // CTC2 - Cipher wheel
  if (projectName.includes('ctc2') || projectName.includes('cipher')) {
    return `<svg class="w-5 h-5" fill="#10B981" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="10"/>
			<circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="2"/>
			<path d="M12 6v6l4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
			<circle cx="12" cy="4" r="1" fill="white"/>
			<circle cx="18" cy="6" r="1" fill="white"/>
			<circle cx="20" cy="12" r="1" fill="white"/>
			<circle cx="18" cy="18" r="1" fill="white"/>
		</svg>`;
  }
  
  // MPT - Molecular structure
  if (projectName.includes('mpt') || projectName.includes('monomial')) {
    return `<svg class="w-5 h-5" fill="#8B5CF6" viewBox="0 0 24 24">
			<circle cx="6" cy="6" r="2"/>
			<circle cx="18" cy="6" r="2"/>
			<circle cx="6" cy="18" r="2"/>
			<circle cx="18" cy="18" r="2"/>
			<circle cx="12" cy="12" r="3"/>
			<path d="M8 6h8M6 8v8M8 18h8M18 8v8M9 9l6 6M15 9l-6 6" stroke="#8B5CF6" stroke-width="1"/>
		</svg>`;
  }
  
  // DL - Delta/Triangle with layers
  if (projectName.includes('dl') && !projectName.includes('hdl')) {
    return `<svg class="w-5 h-5" fill="#14B8A6" viewBox="0 0 24 24">
			<path d="M12 2l10 18H2L12 2z"/>
			<path d="M12 6l6 12H6l6-12z" fill="white"/>
			<path d="M12 10l3 6H9l3-6z" fill="#14B8A6"/>
			<circle cx="12" cy="13" r="1" fill="white"/>
		</svg>`;
  }
  
  // Comeback - Arrow cycle
  if (projectName.includes('comeback')) {
    return `<svg class="w-5 h-5" fill="#F59E0B" viewBox="0 0 24 24">
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
			<path d="M8 12l4-4v3h4v2h-4v3l-4-4z" fill="white"/>
		</svg>`;
  }
  
  // Timing analysis - Clock/stopwatch
  if (projectName.includes('timing') || projectName.includes('ctiming')) {
    return `<svg class="w-5 h-5" fill="#EC4899" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="10"/>
			<path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
			<circle cx="12" cy="12" r="1" fill="white"/>
			<path d="M12 2v2M22 12h-2M12 22v-2M2 12h2" stroke="#EC4899" stroke-width="1"/>
		</svg>`;
  }
  
  // Twinkle - Star burst
  if (projectName.includes('twinkle')) {
    return `<svg class="w-5 h-5" fill="#F472B6" viewBox="0 0 24 24">
			<path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/>
			<circle cx="12" cy="12" r="2" fill="white"/>
			<path d="M12 8v8M8 12h8" stroke="white" stroke-width="1"/>
		</svg>`;
  }
  
  // Craft analysis - Hammer and wrench
  if (projectName.includes('craft')) {
    return `<svg class="w-5 h-5" fill="#0EA5E9" viewBox="0 0 24 24">
			<path d="M13.78 15.3l-2.44-2.44c-.2-.2-.2-.51 0-.71l2.44-2.44c.2-.2.51-.2.71 0l2.44 2.44c.2.2.2.51 0 .71l-2.44 2.44c-.2.2-.51.2-.71 0z"/>
			<path d="M6.29 18.71c.39.39 1.02.39 1.41 0L12 14.41V9.59L7.7 5.29c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 11 6.29 17.3c-.39.39-.39 1.02 0 1.41z"/>
		</svg>`;
  }
  
  // Default crypto icon - Hexagon with lock
  return `<svg class="w-5 h-5" fill="#6366F1" viewBox="0 0 24 24">
		<path d="M12 2l6 3.5v13L12 22l-6-3.5v-13L12 2z"/>
		<circle cx="12" cy="10" r="2" fill="white"/>
		<path d="M12 12v4" stroke="white" stroke-width="2" stroke-linecap="round"/>
	</svg>`;
}function getLanguageBadge(language) {
  const badges = {
    'Python': 'badge-info',
    'C': 'badge-warning', 
    'C++': 'badge-warning',
    'JavaScript': 'badge-accent',
    'TypeScript': 'badge-accent',
    'TeX': 'badge-secondary',
    'Jupyter Notebook': 'badge-primary',
    'MiniZinc': 'badge-success'
  };
  return badges[language] || 'badge-outline';
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

function getPublicationType(name) {
  const publications = {
    'autoguess': 'Published: ACNS 2022',
    'zeroplus': 'Published: FSE 2024', 
    'zero': 'Published: EUROCRYPT 2023',
    'DL': 'Published: CRYPTO 2024',
    'Boomerang': 'Published: FSE 2022',
    'comeback': 'Published: FSE 2023',
    'mpt': 'Published: FSE 2023',
    'faultyaes': 'Published: CHES 2022',
    'course-cryptanalysis': 'Educational Resource',
    'talks': 'Presentation Templates'
  };
  
  return publications[name] || 'Research Tool';
}

async function updateProjectsPage(projectData) {
  try {
    const projectsPath = path.join(process.cwd(), 'src', 'pages', 'projects.astro');
    let content = await fs.readFile(projectsPath, 'utf-8');
    
    // Generate main projects (your original repositories)
    const mainProjectCards = projectData.original.map(generateProjectCard).join('\n\n');
    
    // Generate contributions section with simpler, compact cards
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
      console.log('❌ Could not find section boundaries, content not updated');
      console.log('Main projects start:', mainProjectsStart);
      console.log('Section end:', sectionEnd);
    }
    
    await fs.writeFile(projectsPath, content, 'utf-8');
    console.log('✅ Updated projects.astro');
    
  } catch (error) {
    console.error('❌ Error updating projects.astro:', error.message);
  }
}

function generateMinimalToolsList(projects) {
  if (projects.length === 0) {
    return '';
  }
  
  return `<div class='mt-12'>
			<h2 class='text-2xl font-bold mb-6'>Additional Resources</h2>
			<div class='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div class='card bg-base-100 shadow-xl'>
					<div class='card-body'>
						<h3 class='card-title text-lg'>Utilities</h3>
						<ul class='list-disc list-inside space-y-2 text-sm'>
${projects.map(project => 
	`							<li><a href='${project.url}' target='_blank' class='text-primary hover:underline'>${formatProjectName(project.name)}</a> - ${project.description}</li>`
).join('\n')}
						</ul>
					</div>
				</div>
			</div>
		</div>`;
}

function generateToolsList(projects) {
  const devTools = projects.slice(0, 4);
  const utilities = projects.slice(4, 8);
  
  return `<div class='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div class='card bg-base-100 shadow-xl'>
					<div class='card-body'>
						<h3 class='card-title text-lg'>Development Tools</h3>
						<ul class='list-disc list-inside space-y-2 text-sm'>
${devTools.map(project => 
	`							<li><a href='${project.url}' target='_blank' class='text-primary hover:underline'>${formatProjectName(project.name)}</a> - ${project.description}</li>`
).join('\n')}
						</ul>
					</div>
				</div>
				
				<div class='card bg-base-100 shadow-xl'>
					<div class='card-body'>
						<h3 class='card-title text-lg'>Installation & Utilities</h3>
						<ul class='list-disc list-inside space-y-2 text-sm'>
${utilities.map(project => 
	`							<li><a href='${project.url}' target='_blank' class='text-primary hover:underline'>${formatProjectName(project.name)}</a> - ${project.description}</li>`
).join('\n')}
						</ul>
					</div>
				</div>
			</div>`;
}

async function main() {
  console.log('🚀 Starting projects update process...');
  
  const projectData = await fetchProjectsFromGitHub();
  
  if (projectData.original.length > 0 || projectData.contributions.length > 0) {
    await updateProjectsPage(projectData);
    console.log(`🎉 Projects update completed! Updated ${projectData.original.length} main projects and ${projectData.contributions.length} contributions`);
  } else {
    console.log('⚠️ No projects found, skipping update');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
