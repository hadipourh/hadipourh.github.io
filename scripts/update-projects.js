#!/usr/bin/env node

/**
 * Auto-update projects from GitHub repositories
 * This script fetches project information and updates src/pages/projects.astro
 */

import fs from 'fs/promises';
import path from 'path';

const GITHUB_API = 'https://api.github.com';
const USERNAME = 'hadipourh';

// Featured repositories to highlight
const FEATURED_REPOS = [
  'autoguess',
  'sboxanalyzer', 
  'course-cryptanalysis',
  'zeroplus',
  'zero',
  'ctiming',
  'DL',
  'Boomerang',
  'talks'
];

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
    
    // Filter and sort repositories
    const filteredRepos = repos
      .filter(repo => !repo.fork && !repo.private)
      .filter(repo => repo.name !== USERNAME) // Exclude profile repo
      .sort((a, b) => {
        // Prioritize featured repositories
        const aFeatured = FEATURED_REPOS.indexOf(a.name);
        const bFeatured = FEATURED_REPOS.indexOf(b.name);
        
        if (aFeatured !== -1 && bFeatured !== -1) {
          return aFeatured - bFeatured;
        }
        if (aFeatured !== -1) return -1;
        if (bFeatured !== -1) return 1;
        
        // Then sort by stars, then by update date
        if (a.stargazers_count !== b.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
    
    console.log(`📦 Found ${filteredRepos.length} repositories`);
    
    return filteredRepos.map(repo => ({
      name: repo.name,
      description: repo.description || 'No description available',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      url: repo.html_url,
      topics: repo.topics || [],
      updated: repo.updated_at,
      isFeatured: FEATURED_REPOS.includes(repo.name)
    }));
    
  } catch (error) {
    console.error('❌ Error fetching projects from GitHub:', error.message);
    return [];
  }
}

function generateProjectCard(project) {
  const icon = getProjectIcon(project.name, project.topics);
  const badgeType = getLanguageBadge(project.language);
  const publicationType = getPublicationType(project.name);
  
  return `			<div class='card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow'>
				<div class='card-body'>
					<h2 class='card-title'>
						${icon}
						${formatProjectName(project.name)}
					</h2>
					<p>${project.description}</p>
					<div class='flex gap-2 mt-3 mb-2'>
						<div class='badge badge-primary'>★ ${project.stars}</div>
						<div class='badge badge-outline'>${project.language || 'Mixed'}</div>
						${project.topics.slice(0, 1).map(topic => 
							`<div class='badge badge-outline'>${formatTopic(topic)}</div>`
						).join('')}
					</div>
					<div class='card-actions justify-between'>
						<div class='text-xs text-gray-500'>${publicationType}</div>
						<a href='${project.url}' target='_blank' class='btn btn-primary btn-sm'>View Code</a>
					</div>
				</div>
			</div>`;
}

function getProjectIcon(name, topics) {
  if (name.includes('autoguess') || topics.includes('cryptanalysis')) {
    return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
			<path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
		</svg>`;
  }
  
  if (name.includes('sbox') || topics.includes('s-box')) {
    return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
			<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>`;
  }
  
  if (name.includes('course') || topics.includes('education')) {
    return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
			<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
		</svg>`;
  }
  
  return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
		<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
	</svg>`;
}

function getLanguageBadge(language) {
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

async function updateProjectsPage(projects) {
  try {
    const projectsPath = path.join(process.cwd(), 'src', 'pages', 'projects.astro');
    let content = await fs.readFile(projectsPath, 'utf-8');
    
    // Generate project cards for featured projects
    const featuredProjects = projects.filter(p => p.isFeatured).slice(0, 9);
    const projectCards = featuredProjects.map(generateProjectCard).join('\n\n');
    
    // Generate additional tools list
    const additionalProjects = projects.filter(p => !p.isFeatured).slice(0, 8);
    const toolsList = generateToolsList(additionalProjects);
    
    // Replace the projects grid section
    const gridStart = content.indexOf('<div class=\'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\'>');
    const gridEnd = content.indexOf('</div>\n\t\t\n\t\t<div class=\'mt-12\'>', gridStart);
    
    if (gridStart !== -1 && gridEnd !== -1) {
      const newGridSection = `<div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
			<!-- Top Cryptanalysis Projects -->
${projectCards}
		</div>`;
      
      content = content.substring(0, gridStart) + 
                newGridSection + 
                content.substring(gridEnd);
    }
    
    // Update additional tools section
    const toolsStart = content.indexOf('<div class=\'grid grid-cols-1 md:grid-cols-2 gap-6\'>');
    const toolsEnd = content.indexOf('</div>\n\t\t</div>', toolsStart) + 14;
    
    if (toolsStart !== -1 && toolsEnd !== -1) {
      content = content.substring(0, toolsStart) + 
                toolsList + 
                content.substring(toolsEnd);
    }
    
    await fs.writeFile(projectsPath, content, 'utf-8');
    console.log('✅ Updated projects.astro');
    
  } catch (error) {
    console.error('❌ Error updating projects.astro:', error.message);
  }
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
  
  const projects = await fetchProjectsFromGitHub();
  
  if (projects.length > 0) {
    await updateProjectsPage(projects);
    console.log(`🎉 Projects update completed! Updated ${projects.length} repositories`);
  } else {
    console.log('⚠️ No projects found, skipping update');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
