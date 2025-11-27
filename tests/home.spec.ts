import { expect, test } from '@playwright/test';
import { describe } from 'node:test';

test('home page visible', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('link', { name: 'APIC Logo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Facebook' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Whatsapp' })).toBeVisible();

    await expect(
        page.getByRole('heading', {
            name: "Bienvenue sur le site de l'APIC Sentelette",
        }),
    ).toBeVisible();
    await expect(page.getByText("L'association des parents d'é")).toBeVisible();

    await expect(
        page.getByRole('link', { name: 'admin_panel_settings' }),
    ).toBeVisible();
});

test('facebook link works', async ({ page }) => {
    await page.goto('./');

    const [newPage] = await Promise.all([
        page.waitForEvent('popup'),
        page.getByRole('link', { name: 'Facebook' }).click(),
    ]);

    await expect(newPage).toHaveURL('https://www.facebook.com/rpisentelette');
});

test('whatsapp link works', async ({ page }) => {
    await page.goto('./');

    const [newPage] = await Promise.all([
        page.waitForEvent('popup'),
        page.getByRole('link', { name: 'Whatsapp' }).click(),
    ]);

    await expect(newPage).toHaveURL(
        'https://chat.whatsapp.com/Jcz7TJyL6RiDuoaEbKqRPr',
    );
});

test('admin panel link works', async ({ page }) => {
    await page.goto('./');

    page.getByRole('link', { name: 'admin_panel_settings' }).click();

    await expect(page).toHaveURL(/.*\/admin/);
});
