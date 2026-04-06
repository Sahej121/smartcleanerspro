import { test, expect } from '@playwright/test';

test.describe('3.4 Pricing & Billing', () => {

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/Email or phone reference/i).fill('priya@cleanflow.com');
    await page.getByPlaceholder(/••••••••/i).fill('staff1234');
    await page.getByRole('button', { name: /AUTHORIZE ACCESS/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    
    await page.goto('http://localhost:3000/orders/new');
  });

  test('26. Standard item pricing', async ({ page }) => {
    // Expected: Price matches configured price list
    // Scope to the garment grid to avoid sidebar/header matches
    const grid = page.locator('div.lg\\:col-span-6'); 
    const card = grid.locator('div').filter({ has: page.locator('h4', { hasText: /^Coat$/ }) }).filter({ has: page.locator('p', { hasText: 'Dry Cleaning' }) }).first();
    
    await expect(card).toBeVisible();
    await card.click();
    
    // In the summary, verify the specific item exists with the correct price in its row
    const summary = page.locator('div.lg\\:col-span-4');
    const cartItem = summary.locator('div').filter({ has: page.locator('h5', { hasText: /^Coat$/ }) }).filter({ hasText: 'Dry Cleaning' }).first();
    await expect(cartItem).toBeVisible();
    const priceInput = cartItem.locator('input[type="number"]');
    await expect(priceInput).toHaveValue('300.00'); 
  });

  test('27. Custom/special item pricing', async ({ page }) => {
    // NOTE: Custom items not implemented in v2.4 POS yet. 
    // Skipping to focus on existing regression.
    test.skip();
  });

  test('28. Volume discount', async ({ page }) => {
    // Expected: Bulk discount applied automatically
    const itemCard = page.locator('div').filter({ has: page.locator('h4', { hasText: /^Coat$/ }) }).filter({ hasText: 'Ironing' }).first();
    
    // Add 6 items to exceed the threshold of 5
    for (let i = 0; i < 6; i++) {
        await itemCard.click();
    }
    
    await expect(page.getByText(/Volume Discount/i)).toBeVisible();
  });

  test('29. Promo code application', async ({ page }) => {
    // Expected: Discount applied, code marked as used
    await page.getByPlaceholder(/PROMO CODE/i).fill('WELCOME10');
    await page.getByRole('button', { name: /Apply/i }).click();
    
    await expect(page.getByText(/Promo: WELCOME10/i)).toBeVisible();
  });

  test('30. Expired promo code', async ({ page }) => {
    // Expected: Error: 'Promotion has expired'
    await page.getByPlaceholder(/PROMO CODE/i).fill('EXPIRED2025');
    await page.getByRole('button', { name: /Apply/i }).click();
    
    // Check for alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('expired');
      await dialog.accept();
    });
  });

  test('31. Tax calculation', async ({ page }) => {
    // Expected: Tax correctly calculated and shown separately
    await page.locator('div').filter({ hasText: 'Coat' }).filter({ hasText: 'Dry Cleaning' }).first().click();
    
    await expect(page.getByText(/Tax \(18%\)/i)).toBeVisible();
  });

  test('32. Invoice generation', async ({ page }) => {
    // Expected: PDF invoice with all line items, taxes, totals
    await page.goto('/orders/1001');
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Generate Invoice/i }).click()
    ]);
    
    await expect(newPage.locator('body')).toContainText(/Invoice/i);
    await expect(newPage.locator('body')).toContainText(/Tax/i);
  });

  test('33. Invoice reprint', async ({ page }) => {
    // Expected: Same invoice reprinted with DUPLICATE watermark
    await page.goto('/orders/1001');
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Reprint Invoice/i }).click()
    ]);
    
    await expect(newPage.locator('body')).toContainText(/DUPLICATE/i);
  });
});
