import { expect, type Locator, type Page, test } from '@playwright/test';

async function readBoardValues(board: Locator): Promise<string[]> {
  return (await board.getByRole('button').allTextContents()).map((value) => value.trim());
}

function countNonZeroTiles(values: string[]): number {
  return values.filter((value) => value !== '0').length;
}

async function openArcadeGame(page: Page, gameName: string) {
  const gameButton = page.getByRole('button', { name: gameName, exact: true });
  await gameButton.click();
  await expect(gameButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { level: 2, name: gameName })).toBeVisible();
}

test('home page renders core entry points', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Napolitain/i);
  await expect(page.getByRole('heading', { level: 1, name: 'Napolitain' })).toBeVisible();
  await expect(page.getByText('Software Engineer')).toBeVisible();
  await expect(page.locator('a[href="/blog"]').first()).toBeVisible();
  await expect(page.locator('a[href="/graphics"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /switch to dark mode/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /start learning with a path/i })).toBeVisible();
  await expect(page.locator('a[href="/dsa?path=graph-toolkit"]').first()).toBeVisible();
  await expect(page.locator('a[href="/search"]').filter({ hasText: /search the whole site/i }).first()).toBeVisible();
});

test('main sections and DSA topic navigation work', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/blog"]').first().click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();

  await page.goto('/');
  await page.locator('a[href="/graphics"]').first().click();
  await expect(page).toHaveURL(/\/graphics\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Graphics Atlas' })).toBeVisible();

  await page.goto('/dsa');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/dsa\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'DSA Atlas' })).toBeVisible();

  const searchInput = page.getByRole('searchbox', { name: /search dsa topics/i });
  await searchInput.fill('breadth-first search');
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('breadth-first search');

  await page.getByRole('button', { name: 'Flat list' }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('group')).toBe('flat');

  const bfsTopicLink = page.locator('a[href="/dsa/bfs-breadth-first-search"]').first();
  await expect(bfsTopicLink).toBeVisible();
  await bfsTopicLink.click();

  await expect(page).toHaveURL(/\/dsa\/bfs-breadth-first-search\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: /BFS.*Breadth-First Search/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('DSA Atlas');
  await expect(page.getByRole('heading', { level: 2, name: /from the blog/i })).toBeVisible();

  const graphFundamentalsLink = page.locator('a[href="/dsa/graph-fundamentals"]').first();
  await expect(graphFundamentalsLink).toBeVisible();
  await graphFundamentalsLink.click();

  await expect(page).toHaveURL(/\/dsa\/graph-fundamentals\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Graph Fundamentals' })).toBeVisible();

  await page.getByRole('link', { name: /back to the dsa atlas/i }).click();
  await expect(page).toHaveURL(/\/dsa\/?$/);

  await page.goto('/arcade');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/arcade\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mini Arcade' })).toBeVisible();

  await page.goto('/search?q=graph');
  await expect(page).toHaveURL(/\/search\?q=graph/);
  await expect(page.getByRole('heading', { level: 1, name: /search and discover the whole site/i })).toBeVisible();
  await expect(page.locator('#pagefind-discovery .pagefind-ui__search-input')).toHaveValue('graph', { timeout: 15_000 });
});

test('bfs visualization animates and resets', async ({ page }) => {
  test.slow();

  await page.goto('/dsa/bfs-breadth-first-search');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { level: 2, name: 'Interactive visualization' })).toBeVisible();

  const speedLabel = page.getByText(/Speed: \d+ms/);
  const speedSlider = page.locator('input[type="range"]');
  await speedSlider.evaluate((element) => {
    const slider = element as HTMLInputElement;
    slider.value = '100';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(speedLabel).toHaveText('Speed: 100ms');

  const runButton = page.getByRole('button', { name: 'Run BFS' });
  const resetButton = page.getByRole('button', { name: 'Reset' });
  const firstNode = page.getByRole('img', { name: 'BFS graph visualization' }).locator('circle').first();
  const visitOrder = page.locator('p').filter({ hasText: 'Visit order:' });

  await expect.poll(async () => firstNode.getAttribute('fill')).toBe('var(--muted)');

  await runButton.click();
  await expect.poll(async () => firstNode.getAttribute('fill'), { timeout: 5_000 }).not.toBe('var(--muted)');
  await expect(visitOrder).toContainText('A', { timeout: 5_000 });

  await expect(runButton).toHaveText('Run BFS', { timeout: 10_000 });
  await resetButton.click();

  await expect(visitOrder).toHaveCount(0);
  await expect.poll(async () => firstNode.getAttribute('fill')).toBe('var(--muted)');
});

test('arcade games switch and respond to input', async ({ page }) => {
  test.slow();

  await page.goto('/arcade');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { level: 1, name: 'Mini Arcade' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tic Tac Toe', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { level: 2, name: 'Tic Tac Toe' })).toBeVisible();

  const cell1 = page.getByRole('button', { name: /Cell 1/ });
  const cell2 = page.getByRole('button', { name: /Cell 2/ });
  await cell1.click();
  await expect(cell1).toHaveAttribute('aria-label', 'Cell 1, X');
  await cell2.click();
  await expect(cell2).toHaveAttribute('aria-label', 'Cell 2, O');

  await page.getByRole('button', { name: 'Restart game' }).click();
  await expect(page.getByRole('button', { name: /^Cell 1$/ })).toBeVisible();
  await expect(page.getByText('Turn: X')).toBeVisible();

  await openArcadeGame(page, '2048');
  const game2048Board = page.getByRole('grid', { name: '2048 board' });
  const initialBoard = await readBoardValues(game2048Board);
  let boardChanged = false;

  for (const direction of ['Move left', 'Move up', 'Move right', 'Move down'] as const) {
    await page.getByRole('button', { name: direction }).click();
    const nextBoard = await readBoardValues(game2048Board);
    if (nextBoard.join(',') !== initialBoard.join(',')) {
      boardChanged = true;
      break;
    }
  }

  expect(boardChanged).toBeTruthy();

  await page.getByRole('button', { name: 'Restart game' }).click();
  await expect(page.getByText('Score: 0')).toBeVisible();
  await expect.poll(async () => countNonZeroTiles(await readBoardValues(game2048Board))).toBe(2);

  await openArcadeGame(page, 'Snake');
  const snakeBoard = page.locator('[aria-describedby="snake-board-instructions"]');
  const boardBeforeMove = await snakeBoard.evaluate((node) => node.innerHTML);
  const moveUpButton = page.getByRole('button', { name: 'Move up' });

  await moveUpButton.click();
  await expect(moveUpButton).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => snakeBoard.evaluate((node) => node.innerHTML), { timeout: 3_000 }).not.toBe(boardBeforeMove);
});

test('search modal loads Pagefind results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /search/i }).click();

  const input = page.locator('.pagefind-ui__search-input');
  await expect(input).toBeVisible({ timeout: 15_000 });

  await input.fill('Graphics Atlas');

  const results = page.locator('.pagefind-ui__result-link');
  await expect(results.first()).toBeVisible({ timeout: 15_000 });
  await expect(results.filter({ hasText: 'Graphics Atlas' }).first()).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#pagefind-container')).toHaveCount(0);
});

test('recent atlas history appears after visiting topics', async ({ page }) => {
  await page.goto('/dsa/bfs-breadth-first-search');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('BFS');

  await page.goto('/graphics/gaussian-blur');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Gaussian Blur');

  await page.goto('/dsa');
  await page.waitForLoadState('networkidle');

  const recentHistory = page.getByTestId('recent-atlas-history');
  await expect(recentHistory).toBeVisible();
  await expect(recentHistory.locator('a[href="/dsa/bfs-breadth-first-search"]')).toBeVisible();
  await expect(recentHistory.locator('a[href="/graphics/gaussian-blur"]')).toBeVisible();
});

test('theme toggle persists after reload', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: /switch to dark mode/i });
  await expect(toggle).toBeVisible();

  await toggle.click();

  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('theme'))).toBe('dark');

  await page.reload();

  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: /switch to light mode/i })).toBeVisible();
});
