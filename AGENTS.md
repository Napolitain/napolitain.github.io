# Building and Deploying the Application

This document outlines the process for compiling the Astro + Svelte application into a static website, referencing the GitHub Action workflow.

## Local Compilation

To build the static website locally:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Fetch Data** (Optional but recommended for full content):
    This script fetches repository data from GitHub to populate the portfolio projects.
    ```bash
    npm run fetch-data
    ```

3.  **Build**:
    Compiles the application to the `dist/` directory.
    ```bash
    npm run build
    ```

4.  **Preview**:
    Serve the built static site locally to verify.
    ```bash
    npm run preview
    ```

## GitHub Actions Workflow

The application is automatically built and deployed via the GitHub Action defined in `.github/workflows/fetch-github-data.yml`.

### Workflow Steps

1.  **Checkout**: Checks out the repository code.
2.  **Setup Node.js**: Sets up Node.js environment (v20).
3.  **Install Dependencies**: Runs `npm ci` for a clean install.
4.  **Fetch GitHub Data**: Executes `.github/scripts/fetch-github-data.cjs` to generate `src/data/github-data.json`.
5.  **Build**: Runs `npm run build` to generate the static site in `dist/`.
6.  **Upload Artifact**: Uploads the `dist` directory.
7.  **Deploy**: Deploys the artifact to GitHub Pages.

### Reference: `.github/workflows/fetch-github-data.yml`

```yaml
name: Build and Deploy Portfolio

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node .github/scripts/fetch-github-data.cjs
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - uses: actions/deploy-pages@v4
```
