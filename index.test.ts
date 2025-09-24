import { test, expect } from '@playwright/test';

test('route links', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'App' })).toBeVisible();

  await page.getByRole('link', { name: 'Section 1' }).click();
  await expect(page).toHaveURL(({ pathname }) => pathname === '/sections/1');
  await expect(page.getByRole('heading', { name: 'Intro' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section 2' })).not.toBeVisible();

  await page.getByRole('link', { name: 'Section 2' }).click();
  await expect(page).toHaveURL(({ pathname }) => pathname === '/sections/2');
  await expect(page.getByRole('heading', { name: 'Intro' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section 1' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section 2' })).toBeVisible();

  await page.getByRole('link', { name: 'Intro' }).click();
  await expect(page).toHaveURL(({ pathname }) => pathname === '/');
  await expect(page.getByRole('heading', { name: 'Intro' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section 1' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section 2' })).not.toBeVisible();
});
