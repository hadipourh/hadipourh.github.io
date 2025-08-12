# Website Automation

This website includes automated content management to keep your publications, talks, and projects in sync with external sources.

## Automated Features

### 📚 Publications
- **Source**: DBLP API + Manual curation
- **File**: `src/data/cv.ts`
- **Frequency**: Daily via GitHub Actions
- **Manual**: `npm run update:publications`

### 🎤 Talks  
- **Source**: `hadipourh/talks` GitHub repository
- **File**: `src/pages/talks.astro`
- **Frequency**: Daily via GitHub Actions  
- **Manual**: `npm run update:talks`

### 📦 Projects
- **Source**: GitHub API (your repositories)
- **File**: `src/pages/projects.astro` 
- **Frequency**: Daily via GitHub Actions
- **Manual**: `npm run update:projects`

## Manual Updates

You can manually trigger updates anytime:

```bash
# Update all content
npm run update:all

# Update specific sections
npm run update:publications
npm run update:talks  
npm run update:projects
```

## GitHub Actions Automation

The website automatically updates daily at 6:00 AM UTC via GitHub Actions workflow `.github/workflows/update-content.yml`.

### Setup for GitHub Pages

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. The workflow will automatically build and deploy changes

### Configuration

Update these variables in the automation scripts:

- **DBLP Author Name**: `scripts/update-publications.js`
- **Talks Repository**: `scripts/update-talks.js` 
- **GitHub Username**: `scripts/update-projects.js`

## How It Works

### Publications Update
1. Fetches latest publications from DBLP API
2. Parses and formats publication data
3. Updates the publications array in `cv.ts`
4. Preserves manual additions and corrections

### Talks Update  
1. Reads README.md from your talks repository
2. Extracts talk information (title, venue, links)
3. Generates timeline HTML for talks page
4. Maintains current visual design

### Projects Update
1. Fetches repository data from GitHub API
2. Prioritizes featured repositories  
3. Updates project cards with stars, languages, topics
4. Generates additional tools section

## Customization

### Featured Projects
Edit `FEATURED_REPOS` array in `scripts/update-projects.js`:

```javascript
const FEATURED_REPOS = [
  'autoguess',
  'sboxanalyzer', 
  'your-repo-name'
];
```

### Publication Sources
The publications updater can be extended to include:
- Google Scholar API
- arXiv API
- ORCID API
- Manual BibTeX files

### Talk Information
Talks are parsed from your repository's README.md. Use this format:

```markdown
## Talk Title - Conference Year

• [Paper](link)
• [Slides](link) 
• [Video](link)
• [Code](link)
• Venue: [Location](link)
```

## Troubleshooting

### Rate Limits
- DBLP API: No rate limits
- GitHub API: 60 requests/hour (unauthenticated)
- Use `GITHUB_TOKEN` environment variable for higher limits

### Content Not Updating
1. Check GitHub Actions logs
2. Verify API endpoints are accessible
3. Ensure file paths are correct
4. Run manual updates to test locally

### Preserving Manual Edits
The automation scripts preserve:
- Custom descriptions and formatting
- Manual publication additions
- Layout and styling
- Additional content sections

For questions or issues, check the GitHub Actions logs or run updates manually to debug.
