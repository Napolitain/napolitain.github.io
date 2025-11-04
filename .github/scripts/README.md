# GitHub Data Fetching Script

This directory contains scripts for fetching GitHub data to populate the portfolio website.

## fetch-github-data.cjs

This script fetches real data from the GitHub API and saves it to `src/data/github-data.json`.

### What it fetches:

1. **Pinned Repositories**: Uses gh-pinned-repos API to get pinned repos
2. **User Repositories**: Fetches all repos from the main GitHub user (Napolitain)
3. **Organization Repositories**: Fetches all repos from the organization (fds-napolitain)
4. **Skills**: Extracts programming languages and topics from all repositories

### How to run manually:

```bash
npm run fetch-data
```

or

```bash
node .github/scripts/fetch-github-data.cjs
```

### Automatic execution:

The script is automatically executed by the GitHub Actions workflow (`.github/workflows/fetch-github-data.yml`) on:
- Every push to main
- Every Sunday at midnight (weekly schedule)
- Manual trigger via workflow_dispatch

### Output:

The script generates `src/data/github-data.json` with the following structure:

```json
{
  "lastUpdated": "ISO 8601 timestamp",
  "pinnedRepos": [...],
  "allRepos": [...],
  "skills": {
    "all": [...],
    "categorized": {
      "languages": [...],
      "frontend": [...],
      "backend": [...],
      "tools": [...],
      "other": [...]
    }
  },
  "metadata": {
    "username": "Napolitain",
    "orgName": "fds-napolitain",
    "totalRepos": 0,
    "pinnedRepos": 0,
    "totalSkills": 0
  }
}
```

### API Rate Limits:

The GitHub API has rate limits:
- Unauthenticated: 60 requests per hour
- Authenticated: 5,000 requests per hour

This script should stay well under these limits, but if issues occur, consider adding a GitHub token to the workflow.
