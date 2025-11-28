import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
    authenticatedPage: void;
};

/**
 * Fixture d'authentification pour Playwright
 * Automatise la connexion admin avant les tests
 */
export const test = base.extend<AuthFixtures>({
    authenticatedPage: async ({ page }, use) => {
        // Naviguer vers la page admin
        await page.goto('/admin');

        // Vérifier si déjà authentifié
        const usernameField = page.locator('#username');

        if (await usernameField.isVisible()) {
            // Pas encore authentifié, faire la connexion
            await page.locator('#username').fill('admin');
            await page.locator('input[name="password"]').fill('admin');
            await page
                .getByRole('button', { name: 'login Se connecter' })
                .click();

            // Attendre que la connexion soit complète
            await expect(page.getByText('BlogGalerie')).toBeVisible();
        }

        // Utiliser la page authentifiée
        await use();
    },
});

export { expect };
