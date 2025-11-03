# ✨ Portfolio Generator

A modern portfolio website generator that automatically showcases your GitHub repositories, skills, and projects.

## 🚀 Features

- **Automated Data Fetching**: GitHub Actions workflow that periodically fetches your repository data
- **Static Data Generation**: All GitHub data is pre-fetched and stored as static JSON (no runtime API calls)
- **Privacy First**: Only public, non-fork repositories are included - no private code ever leaks
- **Dynamic Skills**: Skills are automatically extracted from your repositories and CV
- **Pinned Repos**: Featured projects section shows your pinned repositories
- **Organization Support**: Includes repositories from both personal and organization accounts

## 🔧 How It Works

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/fetch-github-data.yml`) that:

1. Runs every 6 hours (configurable via cron schedule)
2. Can be manually triggered via workflow_dispatch
3. Fetches data from:
   - Your pinned repositories (public only)
   - All public repositories from your personal GitHub account
   - All public repositories from your organization
   - Skills from your CV repository (configurable)

4. **Security Features**:
   - Only fetches **public** repositories
   - Filters out **forks**
   - Filters out **private** repositories
   - No authentication tokens stored in the frontend
   - All data is pre-fetched at build time

5. Generates a static JSON file (`src/data/github-data.json`) with all the data
6. Automatically commits and pushes the updated data

### Data Structure

The generated `github-data.json` contains:
```json
{
  "lastUpdated": "ISO timestamp",
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
  "metadata": {...}
}
```

### Configuration

Update the environment variables in `.github/workflows/fetch-github-data.yml`:
- `USERNAME`: Your GitHub username (default: 'Napolitain')
- `ORG_NAME`: Your organization name (default: 'fds-napolitain')
- `CV_REPO`: Your CV repository name (default: 'cv-overleaf')

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Privacy & Security

- ✅ Only public repositories are fetched
- ✅ Private repositories are explicitly filtered out
- ✅ Forks are excluded from the portfolio
- ✅ No API calls made from the client-side
- ✅ All data is pre-generated via GitHub Actions
- ✅ No sensitive tokens or credentials exposed to the frontend

## 📝 Manual Workflow Trigger

You can manually trigger the data fetch workflow:
1. Go to the "Actions" tab in your GitHub repository
2. Select "Fetch GitHub Data" workflow
3. Click "Run workflow"
4. Wait for the workflow to complete
5. The updated data will be committed automatically

## 📄 License

MIT License - See LICENSE file for details.

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
