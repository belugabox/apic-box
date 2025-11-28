import { expect, test } from '@playwright/test';
import { describe } from 'node:test';

describe('gallerie page tests', () => {
    test('gallerie page visible', async ({ page }) => {
        await page.goto('./');

        await expect(
            page.getByRole('heading', { name: 'Galerie PUBLIC' }),
        ).toBeVisible();

        await expect(
            page.getByText('Description Galerie PUBLIC'),
        ).toBeVisible();
        await expect(page.getByText('albums')).toBeVisible();
        await expect(
            page.getByRole('img', { name: 'Galerie PUBLIC cover' }),
        ).toBeVisible();
        await page
            .locator('div')
            .filter({ hasText: 'Galerie PUBLICDescription' })
            .nth(5)
            .click();
        await expect(
            page.getByRole('heading', { name: 'Galerie PUBLIC' }),
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Album 1' }),
        ).toBeVisible();
        await expect(page.getByText('Description Album 1')).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Album 2' }),
        ).toBeVisible();
        await expect(page.getByText('Description Album 2')).toBeVisible();

        await page
            .getByRole('article')
            .filter({ hasText: 'Album 1Description Album' })
            .click();
        await expect(
            page.getByRole('heading', { name: 'Galerie PUBLIC - Album 1' }),
        ).toBeVisible();
        await expect(page.getByText('AL1001')).toBeVisible();
        await expect(page.getByText('AL1003')).toBeVisible();
        await expect(page.getByText('AL1004')).toBeVisible();
        await expect(page.getByText('AL1005')).toBeVisible();
        await expect(page.getByText('AL1006')).toBeVisible();
        await page.getByRole('button', { name: 'arrow_back' }).click();

        await page
            .getByRole('article')
            .filter({ hasText: 'Album 2Description Album' })
            .click();
        await expect(
            page.getByRole('heading', { name: 'Galerie PUBLIC - Album 2' }),
        ).toBeVisible();

        await expect(page.getByText('AL2001')).toBeVisible();
        await expect(page.getByText('AL2002')).toBeVisible();
        await page.getByRole('button', { name: 'arrow_back' }).click();
        await page.getByRole('button', { name: 'arrow_back' }).click();
        await expect(
            page.getByRole('heading', { name: 'Galeries photos' }),
        ).toBeVisible();
    });
});
