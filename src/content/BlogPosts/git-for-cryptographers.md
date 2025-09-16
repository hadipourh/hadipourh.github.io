---
title: "Git for Research: A Practical Guide"
date: "2025-09-11"
excerpt: "A simple guide to version control for research. Learn the basics, safe daily use, and how to handle tricky cases like divergence and rebase."
tags: ["git", "research", "collaboration", "academic", "tools"]
---

# Git for Research: A Practical Guide

Version control is key to modern research. This guide introduces Git with a focus on research projects. It keeps the language simple and shows safe steps for common tasks.

## Why Version Control Matters

In research, we work on code, papers, and data with many changes and collaborators. 
Without version control, you can lose work, run into conflicts, and struggle to reproduce results.
In collaborative projects, version control helps manage contributions from multiple people, track who made which changes, and resolve conflicts when edits overlap.

- [Git for Research: A Practical Guide](#git-for-research-a-practical-guide)
  - [Why Version Control Matters](#why-version-control-matters)
  - [Git Fundamentals](#git-fundamentals)
    - [Installation and Setup](#installation-and-setup)
    - [Setting Up Git (Do This Once)](#setting-up-git-do-this-once)
    - [Creating Your First Repository](#creating-your-first-repository)
    - [Essential Commands](#essential-commands)
    - [Daily Operations](#daily-operations)
  - [Security Considerations](#security-considerations)
    - [Notable Security Incidents](#notable-security-incidents)
    - [Protecting Sensitive Data](#protecting-sensitive-data)
    - [Recovery Procedures](#recovery-procedures)
  - [Collaboration Workflows](#collaboration-workflows)
    - [Basic Repository Operations](#basic-repository-operations)
    - [Contribution Workflow](#contribution-workflow)
  - [Common Issues and Solutions](#common-issues-and-solutions)
    - [Understanding Git Messages](#understanding-git-messages)
    - [Merge Conflicts in Research](#merge-conflicts-in-research)
  - [Handling Divergence and Rebase (Safe and Simple)](#handling-divergence-and-rebase-safe-and-simple)
    - [What is divergence](#what-is-divergence)
    - [Safe rebase checklist](#safe-rebase-checklist)
    - [Small visual guide for rebase](#small-visual-guide-for-rebase)
      - [Fast-forward vs merge](#fast-forward-vs-merge)
      - [Rebase a feature branch onto updated main](#rebase-a-feature-branch-onto-updated-main)
      - [Pushing after a rebase](#pushing-after-a-rebase)
      - [Rebase with conflicts (quick reminder)](#rebase-with-conflicts-quick-reminder)
      - [Optional: squash before merge (clean up)](#optional-squash-before-merge-clean-up)
    - [When not to rebase](#when-not-to-rebase)
    - [Fixing a wrong rebase](#fixing-a-wrong-rebase)
  - [Advanced Techniques](#advanced-techniques)
    - [Branch Management for Research](#branch-management-for-research)
    - [Repository Organization](#repository-organization)
    - [Reproducible Research Tags](#reproducible-research-tags)
  - [Quick Reference](#quick-reference)
    - [Essential Commands](#essential-commands-1)
    - [Useful Resources](#useful-resources)

## Git Fundamentals

### Installation and Setup

```bash
# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt install git

# Check installation
git --version
```

### Setting Up Git (Do This Once)

```bash
# Set your identity (this will appear in all your commits)
git config --global user.name "Your Name"
git config --global user.email "your.email@university.edu"

# Recommended settings for crypto research
git config --global init.defaultBranch main
git config --global core.editor "code --wait"  # Use VS Code as editor
git config --global pull.ff only      # Refuse merge pulls. Keep history clean.
git config --global pull.rebase true  # Rebase when pulling. See rebase section.
```

### Creating Your First Repository

```bash
# Start a new project
mkdir my-crypto-project
cd my-crypto-project
git init

# This creates a hidden .git folder that tracks everything
```

### Essential Commands

The basic Git workflow involves these core operations:

```bash
# 1. Create or edit files
echo "# My Crypto Project" > README.md
echo "print('Hello, cryptography!')" > hello.py

# 2. Check what Git sees
git status

# 3. Add files to staging area (prepare them for commit)
git add README.md hello.py
# or add everything: git add .

# 4. Commit (save a snapshot)
git commit -m "Initial commit with README and hello script"

# 5. Connect to remote repository (like GitHub)
git remote add origin https://github.com/yourusername/my-crypto-project.git

# 6. Push to remote (share with the world)
git push -u origin main
```

### Daily Operations

```bash
# See what changed
git status

# See detailed changes
git diff

# See commit history
git log --oneline

# Update from remote
git pull

# Push your changes
git push
```

## Security Considerations

When working with cryptographic research, security practices are paramount.

### Notable Security Incidents

Examples where sensitive data was exposed due to Git/GitHub usage:

- [Toyota exposed a secret key on GitHub for ~5 years](https://blog.gitguardian.com/toyota-accidently-exposed-a-secret-key-publicly-on-github-for-five-years/?utm_source=chatgpt.com) — A subcontractor uploaded source code to a public repo in 2017 containing an access key to a customer-data server. About 296,019 customers’ data was at risk until discovery in 2022.

- [Leaked GitHub Personal Access Token (PAT) with admin rights on Istio repos](https://www.infoq.com/news/2025/09/github-leaked-secrets/?utm_source=chatgpt.com) — Researchers found a PAT with full admin permissions left in a force-pushed commit, creating a serious supply-chain risk.

- [PyPI admin leaked GitHub PAT in a Docker image](https://blog.pypi.org/posts/2024-07-08-incident-report-leaked-admin-personal-access-token/?utm_source=chatgpt.com) — A debugging change caused a GitHub PAT to be embedded in a `.pyc` file, which ended up in a public Docker image.

- [GhostAction supply-chain campaign](https://www.techradar.com/pro/security/github-supply-chain-attack-sees-thousands-of-tokens-and-secrets-stolen-in-ghostaction-campaign?utm_source=chatgpt.com) — Attackers compromised 817 GitHub repos by injecting malicious workflows that stole 3,325 secrets, including AWS, npm, and PyPI tokens.


### Protecting Sensitive Data

```bash
# Create a .gitignore file
cat > .gitignore << 'EOF'
# Security - Never commit these
*.pem
*.key
private_keys/
secrets.conf
.env

# Research data
test_data/
benchmark_results/
*.log
*.dat

# Temporary files
__pycache__/
*.pyc
.DS_Store

# LaTeX compilation
*.aux
*.bbl
*.blg
*.synctex.gz
EOF

git add .gitignore
git commit -m "Add gitignore for security"
```

### Recovery Procedures

If sensitive data has been committed:

```bash
# Remove from history (use with caution)
git filter-repo --path secret_file.key --invert-paths

# Force push (coordinate with collaborators)  
git push --force-with-lease

# Immediately revoke/change compromised credentials
```

## Collaboration Workflows

### Basic Repository Operations

```bash
# Clone existing repository
git clone https://github.com/username/crypto-project.git

# See all branches
git branch -a

# Create feature branch
git checkout -b my-improvement

# Push changes
git push origin my-improvement
```

### Contribution Workflow

```bash
# 1. Fork repository (via GitHub web interface)
# 2. Clone your fork
git clone https://github.com/yourusername/crypto-project.git

# 3. Make changes and commit
git add .
git commit -m "Implement new feature"

# 4. Keep fork updated
git remote add upstream https://github.com/original/crypto-project.git
git fetch upstream
git merge upstream/main

# Or use rebase to keep a straight history
git rebase upstream/main
```

## Common Issues and Solutions

### Understanding Git Messages

```bash
# "fatal: not a git repository"
# Solution: cd to project directory or run git init

# "Your branch is ahead by 3 commits"  
# Solution: git push

# "Changes not staged for commit"
# Solution: git add <files>

# "Merge conflict in filename"
# Solution: Edit file, remove conflict markers, git add, git commit
```

### Merge Conflicts in Research

When collaborating on papers or code, conflicts occur when multiple people edit the same lines.

```bash
# Check conflicted files
git status

# Edit files to resolve conflicts (remove <<<, ===, >>> markers)
# Add resolved files
git add conflicted_file.tex
git commit -m "Resolve merge conflict in Section 4"

```

## Handling Divergence and Rebase (Safe and Simple)

Sometimes your branch and the remote branch move in different ways. This is divergence. You can handle it in two ways: merge or rebase. New users should pick one and stick to it. We use rebase for a clean history.

### What is divergence

```
A---B---C        origin/main
     \
  D---E      your/local main
```

Your local branch has commits D and E. The remote has C. You need to bring your work on top of C.

### Safe rebase checklist

```bash
# 1) Make sure your work tree is clean
git status

# 2) Update your remote info
git fetch origin

# 3) Rebase your branch onto the fresh main
git rebase origin/main

# 4) If there are conflicts, fix files, then continue
git add <fixed-files>
git rebase --continue

# 5) If you get lost, you can stop the rebase
git rebase --abort
```

If your branch was already pushed and others may have pulled it, use this instead to avoid breaking others:

```bash
# Merge the remote into your branch (no rewrite of existing commits)
git fetch origin
git merge origin/main
```

### Small visual guide for rebase

Before rebase:

```
  D---E   (you)
     /
A---B---C     (origin/main)
```

After `git rebase origin/main`:

```
A---B---C---D'---E'   (you, rebased)
```

Your changes are the same, but now sit after C. This keeps history straight.

#### Fast-forward vs merge

Fast-forward (no parallel commits):

```
Before:
A---B      (main)
     \
  C    (feature)

After fast-forward merge into main:
A---B---C  (main)
```

Regular merge (parallel histories):

```
Before:
A---B---C        (main)
     \
  D---E      (feature)

After merge:
A---B---C-------M   (main)
     \     /
      D---E     (feature)
```

#### Rebase a feature branch onto updated main

```
Before:
A---B---C        (origin/main)
     \
  D---E      (feature)

Rebase command:
$ git checkout feature
$ git fetch origin
$ git rebase origin/main

After:
A---B---C---D'---E'  (feature)
```

#### Pushing after a rebase

After rebasing a branch you already pushed, the remote has the old history. Use a safe update:

```bash
git push --force-with-lease origin feature
```

This refuses to overwrite if teammates pushed new commits meanwhile.

#### Rebase with conflicts (quick reminder)

```bash
git rebase origin/main
# Fix files, then
git add <files>
git rebase --continue
# Or stop if needed
git rebase --abort
```

#### Optional: squash before merge (clean up)

```bash
# Interactively squash D and E into one commit before opening a PR
git checkout feature
git rebase -i origin/main
# In the editor: mark E as "squash" into D, save and exit
```

### When not to rebase

- Do not rebase public branches that teammates already use. Prefer merge.
- For shared branches, use `git pull --rebase` only if your team agrees.

### Fixing a wrong rebase

```bash
# See recent branch positions
git reflog

# Move back to a good point
git reset --hard <reflog-entry>
```

## Advanced Techniques

### Branch Management for Research

```bash
# Feature branch for experiments
git checkout -b experiment/new-attack

# Paper submission branch  
git checkout -b paper/crypto2024-submission

# Collaboration branch
git checkout -b collab/university-partner
```

### Repository Organization

```
crypto-project/
├── src/           # Implementation code
├── tests/         # Experimental scripts  
├── papers/        # LaTeX sources
├── data/          # Small datasets
├── docs/          # Documentation
└── .gitignore     # Security patterns
```

### Reproducible Research Tags

```bash
# Tag important milestones
git tag -a v1.0-submission -m "Code for CRYPTO 2024 submission"
git push origin --tags

# Later reproduce results
git checkout v1.0-submission
```

## Quick Reference

### Essential Commands
```bash
# Starting
git init                    # Initialize repository
git clone <url>            # Copy existing repository

# Daily workflow
git status                 # Check changes  
git add <files>           # Stage changes
git commit -m "message"   # Save snapshot
git push                  # Upload changes
git pull                  # Download updates

# Branching
git checkout -b <branch>  # Create new branch
git merge <branch>        # Combine branches

# Emergency
git reset --soft HEAD~1   # Undo last commit (keep changes)
git reflog               # Find lost commits
```

### Useful Resources
- [Pro Git Book](https://git-scm.com/book) - Comprehensive reference
- [GitHub Documentation](https://docs.github.com) - Platform-specific guides

---

This guide covers fundamental Git workflows for research projects. Version control practices continue to evolve, and we encourage adapting these techniques to specific needs while maintaining security and reproducibility standards.
