import { expect, test } from '@playwright/test';
import { describe } from 'node:test';

describe('admin page tests', () => {
    test('login page if not authenticated', async ({ page }) => {
        await page.goto('/admin');

        await expect(page.locator('#username')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'login Se connecter' }),
        ).toBeVisible();

        await page.locator('#username').click();
        await page.locator('#username').fill('admin');
        await page.locator('input[name="password"]').click();
        await page.locator('input[name="password"]').fill('admin');
        await page.getByRole('button', { name: 'login Se connecter' }).click();
        await expect(page.getByText('BlogGalerie')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'logout' }),
        ).toBeVisible();
    });
});
