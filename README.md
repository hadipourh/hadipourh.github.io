# Academic Website

An academic website built with Astro, featuring automated content updates and a clean, professional design.

## Overview

This website serves as a professional academic platform designed for researchers, academics, and scientists. It provides a clean, responsive interface to showcase research, publications, CV, and professional activities while maintaining high security standards and automated content synchronization.

## Technology Stack

- **Framework**: Astro v5.x (static generation with view transitions)
- **Styling**: TailwindCSS + DaisyUI (32 themes with custom cyberpunk palette)
- **Content**: Markdown with frontmatter validation + JSON datasets
- **Mathematics**: MathJax 3.x for equation rendering
- **Security**: Multi-layer content filtering and rate limiting
- **Automation**: GitHub Actions for content updates and deployment
- **Contact System**: n8n webhook integration with Telegram delivery
- **Hosting**: GitHub Pages (static deployment)

## Key Features

- Automated ingestion of publications, projects, talks, and CV data
- Professional icon system for CV sections (monochrome SVGs with emoji fallback for honors)
- High-contrast, accessibility-aware corporate/night theming across light/dark modes
- Interactive “Quick Message Terminal” with security guards and Telegram delivery
- Auto-generated RSS feed, sitemap, and robots rules for SEO hygiene

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd mywebsite
   npm install
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Configuration

### Personal Information (src/settings.ts)
Configure your personal details, research areas, and social media links:
```typescript
export const profile = {
  fullName: "Your Name",
  title: "Your Title",
  institute: "Your Institution",
  research_areas: ["Area 1", "Area 2"],
  // ... additional settings
};
```

### CV Data (src/data/cv.ts)
Core CV sections (experience, education, skills, honors, etc.) are stored in `src/data/cv.ts` and can be automatically updated from your LaTeX CV using the CV parser script. Publications are no longer hard-coded here—they're auto-generated from DBLP (see below).

### Auto-Generated Publications (src/data/publications.json)
Publications are automatically synchronized from DBLP via `scripts/update-publications.js` and stored in `src/data/publications.json`. Pages (home, CV, papers) consume this JSON directly. The update script runs automatically every 6 days or can be triggered manually.

### Professional Icon Mapping (src/data/researchIcons.ts)
CV sections and research areas reference semantic icon keys. The icon system uses SVG assets from `src/assets/social-icons/` for a consistent, professional look.

## Content Management

### Blog Posts
- **Location**: `src/content/BlogPosts/`
- **Format**: Markdown with frontmatter
- **Required fields**: title, date, excerpt
- **Optional fields**: tags (array)

**Example post structure:**
```markdown
---
title: "Research Update"
date: "2024-09-08"
excerpt: "Brief description of the post"
tags: ["research", "cryptography"]
---

Your markdown content here with MathJax support:
$$E = mc^2$$
```

### Mathematical Content
- **Engine**: MathJax 3.x
- **Inline math**: `$equation$`
- **Display math**: `$$equation$$`
- **LaTeX support**: Full LaTeX mathematical notation (rendered in posts and leveraged during CV imports)

## Automation Features

The website includes several automation scripts for content management:

### Publications Update
```bash
npm run update:publications  # Updates from DBLP API
```

### Talks Management
```bash
npm run update:talks  # Syncs from GitHub repository
```

### Projects Sync
```bash
npm run update:projects  # Fetches from GitHub API
```

### CV Updates
```bash
npm run update:cv  # Parses CV.tex and refreshes src/data/cv.ts
```

### All Updates
```bash
npm run update:all  # Runs all update scripts
```

### GitHub Actions Auto-Deployment Setup

The website automatically updates content and deploys every 6 days via GitHub Actions. To enable this:

1. **Create a Personal Access Token (PAT)**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name it "Website Auto Deploy"
   - Set expiration (recommended: 1 year)
   - Select scopes:
     - ✅ `repo` (all sub-scopes)
     - ✅ `workflow` (to trigger deployment workflows)
   - Click "Generate token" and **copy it immediately**

2. **Add PAT as Repository Secret**:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: Paste your PAT
   - Click "Add secret"

3. **How It Works**:
   - The `update-content.yml` workflow runs on schedule (every 6 days)
   - Updates publications, talks, and projects from external sources
   - Commits changes using the PAT (not default `GITHUB_TOKEN`)
   - The PAT-authenticated push triggers the `deploy.yml` workflow
   - Site automatically rebuilds and deploys to GitHub Pages

**Note**: Using a PAT instead of `GITHUB_TOKEN` is required because GitHub prevents the default token from triggering other workflows (security feature to prevent recursive runs).

## Security Features

### Terminal Contact System
- **Rate limiting**: 5-second intervals between messages
- **Content filtering**: Multi-layer XSS and injection protection
- **Encoding detection**: URL and HTML entity decoding
- **Message validation**: Length limits and pattern matching
- **Request security**: Timeouts and fingerprinting

### Security Measures
- **Input sanitization**: Multiple encoding detection layers
- **Rate limiting**: Client-side and server-side protection
- **Content validation**: Suspicious pattern detection
- **Error handling**: Secure error messages
- **Monitoring**: Built-in abuse detection

## Maintenance

### Regular Updates
1. **Content synchronization** (automated every 6 days via GitHub Actions)
2. **Security patches** (monitor for vulnerabilities)
3. **Dependencies** (regular npm audit and updates)
4. **Performance monitoring** (build times and site speed)

### Manual Maintenance Tasks
- **Blog posts**: Add new content in `src/content/BlogPosts/`
- **CV updates**: Update `public/cv/CV.tex` and run `npm run update:cv` to sync changes
- **Settings**: Modify `src/settings.ts` for profile changes
- **Themes**: Customize in `tailwind.config.mjs` (supports 32 DaisyUI themes)

### Deployment Preparation
```bash
npm run build  # Generate static files
npm run preview  # Test production build locally
```

### File Structure
```
src/
  components/     # Reusable UI components
  content/        # Blog posts and content collections
  data/          # CV and research data
  layouts/       # Page layouts
  pages/         # Route pages
  lib/           # Utility functions
  assets/        # Static assets
public/
  images/        # Public images
  cv/           # CV files
scripts/        # Automation scripts
```

## Troubleshooting

### Common Issues
- **Build errors**: Check content frontmatter validation in blog posts
- **MathJax not rendering**: Verify LaTeX equation syntax
- **Terminal contact not working**: Check n8n webhook connectivity
- **Automation failures**: Verify PAT_TOKEN is set in repository secrets
- **Publication updates failing**: Check DBLP API availability

### Debug Commands
```bash
npm run build  # Check for build errors
npm run preview  # Test production build
npm run update:all  # Manually trigger all content updates
```

## Contributing

When making changes:
1. Test locally with `npm run dev`
2. Verify build with `npm run build`
3. Check security with terminal testing
4. Update documentation as needed
5. Follow commit message conventions

## License

Academic use and personal portfolios encouraged. Check specific license terms for commercial use.
