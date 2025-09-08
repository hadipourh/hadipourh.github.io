# Academic Website

A modern, secure academic website built with Astro, featuring automated content management, interactive terminals, and comprehensive security measures.

## Overview

This website serves as a professional academic platform designed for researchers, academics, and scientists. It provides a clean, responsive interface to showcase research, publications, CV, and professional activities while maintaining high security standards and automated content synchronization.

## Technology Stack

- **Framework**: Astro v5.13.3 (Static Site Generator)
- **Styling**: TailwindCSS + DaisyUI (32 themes)
- **Content**: Markdown with frontmatter validation
- **Mathematics**: MathJax 3.x for equation rendering
- **Security**: Multi-layer content filtering and rate limiting
- **Automation**: GitHub Actions + n8n workflows
- **Hosting**: Static deployment ready

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
Structure your academic CV with automated updates:
```typescript
export const publications = [
  {
    title: "Paper Title",
    authors: ["Author 1", "Author 2"],
    venue: "Conference/Journal",
    year: "2024"
  }
];
```

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
- **LaTeX support**: Full LaTeX mathematical notation

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
npm run update:cv  # Parses encrypted CV file
```

### All Updates
```bash
npm run update:all  # Runs all update scripts
```

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
1. **Content synchronization** (automated daily via GitHub Actions)
2. **Security patches** (monitor for vulnerabilities)
3. **Dependencies** (regular npm audit and updates)
4. **Performance monitoring** (build times and site speed)

### Manual Maintenance Tasks
- **Blog posts**: Add new content in `src/content/BlogPosts/`
- **CV updates**: Update `src/data/cv.ts` or run CV parser
- **Settings**: Modify `src/settings.ts` for profile changes
- **Theme**: Customize in `tailwind.config.mjs`

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
- **Build errors**: Check content frontmatter validation
- **MathJax not rendering**: Verify equation syntax
- **Terminal not working**: Check network connectivity
- **Automation failures**: Verify API keys and permissions

### Debug Commands
```bash
npm run build  # Check for build errors
grep -r "error" dist/  # Search for runtime errors
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
