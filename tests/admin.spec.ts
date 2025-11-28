import { expect, test } from './fixtures/auth.fixture';

test.describe('admin page tests', () => {
    test("not authenticated user can't access admin page", async ({ page }) => {
        await page.goto('/admin');
        await expect(page.locator('#username')).toBeVisible();
    });

    test('authenticated user can access admin page', async ({
        authenticatedPage,
        page,
    }) => {
        // Cette page est déjà authentifiée grâce à la fixture
        await expect(page.getByText('BlogGalerie')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'logout' }),
        ).toBeVisible();
    });

    test('logout works correctly', async ({ authenticatedPage, page }) => {
        // Cette page est déjà authentifiée grâce à la fixture
        await expect(page.getByText('BlogGalerie')).toBeVisible();
        await page.getByRole('button', { name: 'logout' }).click();
        await expect(page.locator('#username')).toBeVisible();
    });
});
