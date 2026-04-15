import { test, expect } from '@playwright/test';

test.describe('Demo Chat Application', () => {
  test('should display the chat interface', async ({ page }) => {
    await page.goto('/');

    // Verify app title
    const title = page.getByTestId('app-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Demo Chat');

    // Verify app subtitle
    const subtitle = page.getByTestId('app-subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText('powered by Bodhi Browser Extension');

    // Verify React app mounted
    await expect(page.locator('#root')).toBeVisible();
  });
});
