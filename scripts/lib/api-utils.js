/**
 * Shared API utilities for update scripts
 * Provides common functions for GitHub API, DBLP API, and other external services
 */

/**
 * Get GitHub API headers with optional authentication
 * @returns {Object} Headers object for GitHub API requests
 */
export function getGitHubHeaders() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Academic-Website-Bot'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  return headers;
}

/**
 * Get DBLP API headers
 * @returns {Object} Headers object for DBLP API requests
 */
export function getDBLPHeaders() {
  return {
    'Accept': 'application/json',
    'User-Agent': 'Academic-Website-Bot'
  };
}

/**
 * Fetch with retry logic and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Handle rate limiting
      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        if (rateLimitReset) {
          const resetTime = new Date(rateLimitReset * 1000);
          console.log(`Rate limit reached. Resets at ${resetTime.toLocaleString()}`);
        } else {
          console.log('Rate limit reached. Try setting GITHUB_TOKEN environment variable.');
        }
        throw new Error(`Rate limit exceeded: ${response.status}`);
      }
      
      // Retry on server errors
      if (response.status >= 500 && i < maxRetries - 1) {
        console.log(`Server error (${response.status}), retrying in ${(i + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`Fetch failed, retrying... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
