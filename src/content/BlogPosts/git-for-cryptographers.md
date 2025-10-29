---
title: "Git for Research: A Practical Guide"
date: "2025-10-29"
excerpt: "A comprehensive guide to version control for researchers. Learn Git basics, security best practices for protecting secrets, handling divergence and rebases, and recovering from mistakes—all with clear explanations and real-world examples."
tags: ["git", "research", "security", "collaboration", "version-control", "best-practices"]
---
# Git for Research: A Practical Guide

Version control is key to modern research. This guide introduces Git with a focus on research projects. It keeps the language simple and shows safe steps for common tasks.

- [Git for Research: A Practical Guide](#git-for-research-a-practical-guide)
  - [Why Version Control Matters](#why-version-control-matters)
  - [Git Fundamentals](#git-fundamentals)
    - [Installation and Setup](#installation-and-setup)
    - [Setting Up Git (Do This Once)](#setting-up-git-do-this-once)
    - [Creating Your First Repository](#creating-your-first-repository)
    - [Essential Commands](#essential-commands)
    - [Daily Operations](#daily-operations)
  - [Security: Protect Your Secrets](#security-protect-your-secrets)
    - [Real Security Incidents](#real-security-incidents)
    - [Protect Your Secrets](#protect-your-secrets)
    - [If You Already Committed a Secret](#if-you-already-committed-a-secret)
  - [Working with Others](#working-with-others)
    - [Clone and Branch](#clone-and-branch)
    - [Contributing to Other Projects](#contributing-to-other-projects)
  - [Fixing Problems](#fixing-problems)
    - [Common Error Messages](#common-error-messages)
    - [Handling Merge Conflicts](#handling-merge-conflicts)
  - [Understanding Rebase](#understanding-rebase)
    - [What is Divergence?](#what-is-divergence)
    - [When to Use Rebase](#when-to-use-rebase)
    - [How to Rebase Safely](#how-to-rebase-safely)
    - [Rebase Visual Guide](#rebase-visual-guide)
    - [Pushing After Rebase](#pushing-after-rebase)
    - [Recovering from Mistakes](#recovering-from-mistakes)
      - [1. Discard uncommitted changes](#1-discard-uncommitted-changes)
      - [2. Undo commits (but keep your work)](#2-undo-commits-but-keep-your-work)
      - [3. Recovery from major mistakes (rebase, merge gone wrong)](#3-recovery-from-major-mistakes-rebase-merge-gone-wrong)
  - [Advanced Tips](#advanced-tips)
    - [Organize Your Research Project](#organize-your-research-project)
    - [File Structure](#file-structure)
    - [Tag Important Versions](#tag-important-versions)
  - [Quick Reference](#quick-reference)
    - [Essential Commands](#essential-commands-1)
    - [Learn More](#learn-more)


## Why Version Control Matters

Research involves code, papers, and data that change constantly. Without version control, you risk losing work, creating conflicts, and failing to reproduce results.

Version control helps you:

- Track every change and who made it
- Work with collaborators without conflicts
- Return to any previous version
- Reproduce published results exactly

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
# Set your identity (appears in all your commits)
git config --global user.name "Your Name"
git config --global user.email "your.email@university.edu"

# Recommended settings
git config --global init.defaultBranch main
git config --global core.editor "code --wait"  # Use VS Code
git config --global pull.rebase true           # Keep history clean
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

Git workflow has four steps: edit, stage, commit, push.

```bash
# 1. Create or edit files
echo "# My Crypto Project" > README.md

# 2. Check what changed
git status

# 3. Stage files (prepare for commit)
git add README.md
# or stage everything: git add .

# 4. Commit (save snapshot with message)
git commit -m "Add README file"

# 5. Push to GitHub (first time)
git remote add origin https://github.com/yourusername/my-project.git
git push -u origin main

# 6. Push updates (after first time)
git push
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

## Security: Protect Your Secrets

Git stores everything forever. A leaked secret stays in history even after you delete the file.

### Real Security Incidents

- [Toyota exposed a secret key on GitHub for ~5 years](https://blog.gitguardian.com/toyota-accidently-exposed-a-secret-key-publicly-on-github-for-five-years/?utm_source=chatgpt.com) — In December 2017, a subcontractor uploaded T-Connect source code to a public GitHub repo containing a hardcoded access key to the data server managing customer information. The repo remained public until September 2022, exposing data for 296,019 customers including customer IDs and emails.
- [Leaked GitHub Personal Access Token (PAT) with admin rights on Istio repos](https://www.infoq.com/news/2025/09/github-leaked-secrets/?utm_source=chatgpt.com) — Security researchers discovered a GitHub PAT with admin permissions over Istio repositories in force-pushed "oops commits" that GitHub archives. The token was found through scanning dangling commits and was swiftly revoked after responsible disclosure.
- [PyPI admin leaked GitHub PAT in a Docker image](https://blog.pypi.org/posts/2024-07-08-incident-report-leaked-admin-personal-access-token/?utm_source=chatgpt.com) — A PyPI infrastructure director hardcoded a GitHub PAT during local development to bypass rate limits. The token ended up in `.pyc` compiled bytecode files that were included in Docker images published to Docker Hub in 2023, remaining exposed until reported by JFrog researchers on June 28, 2024.

**Lesson**: Never commit secrets. Ever.

### Protect Your Secrets

Create a `.gitignore` file to block sensitive files:

```bash
# Create .gitignore
cat > .gitignore << 'EOF'
# Never commit these
*.pem
*.key
*.env
private_keys/
secrets.conf

# Data files
test_data/
*.log

# Temporary files
__pycache__/
.DS_Store
EOF

git add .gitignore
git commit -m "Add gitignore"
```

### If You Already Committed a Secret

**Step 1**: Rotate the secret immediately. Consider it compromised forever.

**Step 2**: Remove from Git history:

```bash
# Install git-filter-repo
brew install git-filter-repo  # macOS
sudo apt install git-filter-repo  # Ubuntu

# Remove file from all commits
# --invert-paths = keep everything EXCEPT this file
git filter-repo --path secret_file.key --invert-paths

# Remove directory
git filter-repo --path secrets/ --invert-paths

# Remove by pattern (all .pem files)
git filter-repo --path-glob '*.pem' --invert-paths

# Update remote
git push --force-with-lease origin main
```

**Step 3**: Contact [GitHub support](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) to clear their cache.

**Step 4**: Tell all team members to re-clone the repository.

## Working with Others

### Clone and Branch

```bash
# Get a copy of existing project
git clone https://github.com/username/project.git

# See all branches
git branch -a

# Create your own branch
git checkout -b my-feature

# Push your branch
git push origin my-feature
```

### Contributing to Other Projects

```bash
# 1. Fork on GitHub (use web interface)

# 2. Clone your fork
git clone https://github.com/yourusername/project.git
cd project

# 3. Add original as "upstream"
git remote add upstream https://github.com/original/project.git

# 4. Keep your fork updated
git fetch upstream
git rebase upstream/main  # Keeps clean history

# 5. Make changes and push
git add .
git commit -m "Fix bug in crypto function"
git push origin my-feature

# 6. Create Pull Request on GitHub
```

## Fixing Problems

### Common Error Messages

```bash
# "fatal: not a git repository"
# Fix: You're not in a Git project folder
cd /path/to/your/project

# "Your branch is ahead by 3 commits"
# Fix: You have commits that need pushing
git push

# "Changes not staged for commit"
# Fix: Stage your changes first
git add <files>

# "Merge conflict in filename"
# Fix: Open file, fix conflicts, then:
git add filename
git commit -m "Fix conflict"
```

### Handling Merge Conflicts

Conflicts happen when two people change the same lines.

```bash
# Check which files have conflicts
git status

# Open conflicted file. You'll see:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name
```

```bash
# Fix: Keep one version or combine both. Remove conflict markers.
# Then:
git add fixed_file.tex
git commit -m "Resolve conflict in Section 4"
```

## Understanding Rebase

### What is Divergence?

Your local branch and remote branch have different commits:

```
A---B---C        (remote: origin/main)
     \
      D---E      (local: your main)
```

This diagram shows:

- Both branches share commits A and B (common ancestor)
- The remote `origin/main` has commit C (perhaps a colleague pushed it)
- Your local `main` has commits D and E (your work)
- The branches have **diverged** at commit B
- You cannot simply push or pull—you need to reconcile these differences

You need to combine them. Two options: **merge** or **rebase**:

- **Merge**: Creates a merge commit (messy history)
- **Rebase**: Moves your commits on top (clean history)

### When to Use Rebase

Use rebase when:

- Working on your own branch
- You want clean, linear history
- Before creating a pull request

Don't use rebase when:

- Others are using the same branch
- The branch is already public and shared

### How to Rebase Safely

```bash
# 1. Make sure everything is committed
git status  # Should show "nothing to commit"

# 2. Get latest changes
git fetch origin

# 3. Rebase your work on top
git rebase origin/main

# 4. If conflicts appear:
# - Fix the conflicted files
git add <fixed-files>
git rebase --continue

# 5. If you mess up:
git rebase --abort  # Returns to before rebase
```

### Rebase Visual Guide

**Before rebase:**

```
      D---E   (your work)
     /
A---B---C     (origin/main)
```

In this scenario:

- You created your branch at commit B
- Meanwhile, someone else pushed commit C to the remote main branch
- Your commits D and E are based on B, but main has moved forward to C
- Your history has **diverged** from the main branch

**After rebase:**

```
A---B---C---D'---E'   (your work moved on top)
```

After running `git rebase origin/main`:

- Your commits D and E are **replayed** on top of C (the latest commit on main)
- Git creates new commits D' and E' with the same changes but different commit hashes
- The apostrophe (') indicates these are new commits with new SHA hashes
- Your branch now has a clean, linear history on top of the latest main branch
- The original D and E commits still exist temporarily (recoverable via `git reflog`)

### Pushing After Rebase

Rebase rewrites history. If you already pushed your branch:

```bash
# Safe force push (checks for new commits first)
git push --force-with-lease origin my-branch
```

**Warning**: Never force push to shared branches like `main`.

### Recovering from Mistakes

Git keeps a history of where HEAD (your current position) has been. You can always go back!

#### 1. Discard uncommitted changes

**Throw away all local modifications (most common):**

```bash
git reset --hard HEAD
```

- `HEAD` means "current commit" (no movement in history)
- Throws away ALL uncommitted changes in your working directory
- Resets staged files back to unstaged
- Use when you've made a mess and want to start fresh from the last commit
- **Warning**: Cannot be undone - all local modifications are lost permanently

#### 2. Undo commits (but keep your work)

**Undo last commit but keep changes staged:**

```bash
git reset --soft HEAD~1
```

- `HEAD~1` means "one commit before the current HEAD"
- `--soft` moves HEAD back but keeps all changes staged
- Your files stay exactly as they were
- Use when you want to fix the commit message or add more changes before committing
- Safe: Your work is preserved in the staging area

#### 3. Recovery from major mistakes (rebase, merge gone wrong)

**First, check what happened:**

```bash
# See all recent actions (last 20 by default)
git reflog
```

This shows output like:

```
abc1234 HEAD@{0}: commit: Add new attack
def5678 HEAD@{1}: rebase finished
9ab0123 HEAD@{2}: checkout: moving from main to feature-branch
```

**Then, go back to a previous state:**

```bash
git reset --hard HEAD@{2}
```

- `HEAD@{2}` means "where HEAD was 2 steps ago" (from reflog output)
- `--hard` discards all changes and moves HEAD to that previous state
- Use when you want to completely undo a bad rebase or merge
- **Warning**: This permanently deletes uncommitted changes
- The number in `HEAD@{n}` comes from the reflog - check reflog first!

## Advanced Tips

### Organize Your Research Project

Use descriptive branch names:

```bash
# For experiments
git checkout -b experiment/differential-attack

# For papers
git checkout -b paper/crypto2024

# For collaborations
git checkout -b collab/alice-bob
```

### File Structure

```
project/
├── src/           # Code
├── tests/         # Test scripts
├── papers/        # LaTeX files
├── data/          # Small datasets
├── docs/          # Documentation
└── .gitignore
```

### Tag Important Versions

Tags mark specific points in history (like paper submissions):

```bash
# Create tag
git tag -a v1.0 -m "CRYPTO 2024 submission"
git push origin --tags

# Return to tagged version later
git checkout v1.0

# Go back to latest
git checkout main
```

## Quick Reference

### Essential Commands

```bash
# Setup
git init                    # Start new repository
git clone <url>            # Copy existing repository

# Daily work
git status                 # See what changed
git add <files>           # Stage changes
git commit -m "message"   # Save snapshot
git push                  # Send to GitHub
git pull                  # Get updates

# Branching
git checkout -b <branch>  # Create branch
git merge <branch>        # Combine branches

# Undo
git reset --soft HEAD~1   # Undo commit, keep changes
git reset --hard HEAD~1   # Undo commit, delete changes
git reflog               # See all actions (for recovery)
```

### Learn More

- [Pro Git Book](https://git-scm.com/book) - Free complete guide
- [GitHub Guides](https://docs.github.com) - GitHub-specific help

---

**Remember**: Git takes time to learn. Start with basic commands and add more as you need them. The key is to commit often and write clear messages.
