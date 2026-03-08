---
name: playwright-verification
description: Run lint, build, Astro preview, and Playwright verification for this portfolio site. Use this when validating UI behavior or debugging end-to-end regressions.
---

Use this skill when asked to verify user-facing behavior in this repository.

## Verification workflow

1. Start from the repository root.
2. Run `npm run lint`.
3. If browsers are not installed yet, run `npm run test:e2e:install`.
4. Run `npm run test:e2e`.
   - This repository's e2e command builds the site, generates the Pagefind index, starts `astro preview`, and runs the Playwright suite.
5. If a failure occurs, inspect `test-results/` and `playwright-report/` before proposing a fix.

## What the suite is expected to verify

- the homepage renders its core entry points
- main-area navigation for `/blog`, `/graphics`, `/dsa`, and `/arcade`
- the DSA atlas search and topic navigation flows work
- the BFS topic visualization actually animates, updates state, and resets correctly
- arcade game tabs switch correctly and the tested games respond to input (currently Tic Tac Toe, 2048, and Snake)
- the search modal opens and returns Pagefind results
- the theme toggle persists the selected theme across reloads

## Debugging guidance

- For headed local debugging, run `npm run test:e2e:headed`.
- To review the last HTML report, run `npm run test:e2e:report`.
- In CI on Ubuntu, install the browser with `npm run test:e2e:install -- --with-deps`.
- Prefer stable accessibility selectors and visible behavior over brittle DOM structure assertions.
- Do not rewrite content pages just to satisfy a brittle test; fix the regression or improve the test selector instead.
