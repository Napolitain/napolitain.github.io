# ✨ Portfolio Generator

A modern portfolio website generator that automatically showcases your GitHub repositories, skills, and projects. Built with **Astro**, **Svelte**, and **TypeScript**.

## 🚀 Features

- **Automated Data Fetching & Deployment**: GitHub Actions workflow that weekly fetches your repository data and deploys to GitHub Pages
- **Fully Static Website**: All GitHub data is pre-fetched and built into a static site (no runtime API calls)
- **Privacy First**: Only public, non-fork repositories are included - no private code ever leaks
- **Dynamic Skills**: Skills are automatically extracted from your repositories and CV
- **Pinned Repos**: Featured projects section shows your pinned repositories
- **Organization Support**: Includes repositories from both personal and organization accounts
- **Fast Loading**: Optimized static build deployed to GitHub Pages CDN
- **Modern Stack**: Built with Astro for optimal performance and Svelte for reactive components

## 🔧 Tech Stack

- **Framework**: [Astro](https://astro.build) - Fast, content-focused static site generator
- **UI Components**: [Svelte](https://svelte.dev) - Reactive, component-based UI library
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Phosphor Icons (Svelte)
- **Animations**: Svelte transitions and animations

## 🔧 How It Works

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/fetch-github-data.yml`) that:

1. Runs weekly on Sundays at 00:00 UTC (configurable via cron schedule)
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

4. Generates a static JSON file (`src/data/github-data.json`) with all the data
6. Builds the Astro + Svelte application as a fully static website
7. Deploys the static site to GitHub Pages
8. Commits the updated data back to the repository

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

The workflow can be configured in two ways:

#### Option 1: Repository Variables (Recommended)
Set these in your GitHub repository settings under Settings > Secrets and variables > Actions > Variables:
- `GITHUB_USERNAME`: Your GitHub username
- `GITHUB_ORG_NAME`: Your organization name
- `CV_REPO_NAME`: Your CV repository name

#### Option 2: Edit Workflow File
Update the default values in `.github/workflows/fetch-github-data.yml`:
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

## 📝 Manual Workflow Trigger & Deployment

You can manually trigger the build and deployment workflow:
1. Go to the "Actions" tab in your GitHub repository
2. Select "Build and Deploy Portfolio" workflow
3. Click "Run workflow"
4. Wait for the workflow to complete
5. The updated site will be live on GitHub Pages and data committed to the repository

### Setting up GitHub Pages

To enable GitHub Pages for your repository:
1. Go to repository Settings > Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. The workflow will automatically deploy on the next run

Your portfolio will be available at: `https://[username].github.io/portfolio-generator/`

## 📄 License

MIT License - See LICENSE file for details.

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
