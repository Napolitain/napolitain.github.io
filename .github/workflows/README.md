# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the portfolio website.

## Workflows

### 1. fetch-github-data.yml - Build and Deploy Portfolio

This workflow builds and deploys the portfolio website to GitHub Pages.

**Triggers:**
- Weekly on Sundays at 00:00 UTC
- Manual trigger via workflow_dispatch
- Push to main branch (when specific files change)

**What it does:**
1. Fetches GitHub data (repositories, skills, etc.)
2. Builds the static Astro site
3. Deploys to GitHub Pages

### 2. dependabot-approval.yml - Dependabot Auto-merge

This workflow automatically enables auto-merge for Dependabot PRs.

**Triggers:**
- When a pull request is opened or updated

**What it does:**
1. Checks if the PR is from Dependabot
2. Fetches Dependabot metadata
3. Enables auto-merge for patch version updates

**Important Note about Auto-Approval:**

The workflow does **not** include auto-approval because `GITHUB_TOKEN` cannot approve pull requests - this is a GitHub Actions security limitation.

**If you need auto-approval**, you have two options:

#### Option 1: Use a Personal Access Token (Recommended for personal repos)

1. Create a Personal Access Token (classic) with `repo` scope:
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name like "Dependabot Auto-Approve"
   - Select the `repo` scope
   - Generate the token and copy it

2. Add the token as a repository secret:
   - Go to your repository Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: paste your token
   - Click "Add secret"

3. Uncomment the approval step in `dependabot-approval.yml`

#### Option 2: Configure Branch Protection (Simpler alternative)

Instead of requiring approvals, you can configure your repository to allow auto-merge without approvals for Dependabot PRs:

1. Go to repository Settings > Branches
2. Edit your branch protection rules (or create new ones)
3. Enable "Require status checks to pass before merging"
4. Do NOT enable "Require approvals" or set it to 0 required approvals
5. The workflow will still enable auto-merge, and PRs will merge automatically once CI passes

This way, you don't need a PAT and the workflow will work with the default `GITHUB_TOKEN`.

## Security Considerations

- The workflows use the default `GITHUB_TOKEN` which has limited permissions
- The `GITHUB_TOKEN` cannot approve PRs by design (GitHub security feature)
- Personal Access Tokens should be stored as secrets, never committed to code
- PATs have broader permissions, so use them carefully and rotate them regularly
