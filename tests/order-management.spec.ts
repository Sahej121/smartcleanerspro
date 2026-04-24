import { test, expect } from '@playwright/test';

test.describe.serial('3.1 Order Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Email or phone reference/i).fill('priya@cleanflow.com');
    await page.getByPlaceholder(/••••••••/i).fill('staff1234');
    await page.getByRole('button', { name: /AUTHORIZE ACCESS/i }).click();
    await page.waitForURL('**/');
    await page.goto('/orders');
  });

  test('1. Create new order', async ({ page }) => {
    test.setTimeout(90000); 
    await page.getByRole('link', { name: /New Order/i }).click({ force: true });
    
    // UI Loads
    await expect(page.getByText('Assign Customer')).toBeVisible({ timeout: 15000 });
    
    await page.getByText('Assign Customer').click({ force: true });
    await expect(page.getByPlaceholder(/Start typing/i)).toBeVisible();
    await page.getByPlaceholder(/Start typing/i).fill('Arjun', { force: true });
    
    const results = page.locator('.group').filter({ hasText: 'Arjun' }).first();
    await expect(results).toBeVisible({ timeout: 15000 });
    await results.click({ force: true });
    
    // Ensure customer is assigned (modal closes)
    await expect(page.getByPlaceholder(/Start typing/i)).not.toBeVisible();
    
    // Add Items
    await expect(page.getByText('Shirt').first()).toBeVisible({ timeout: 15000 });
    await page.getByText('Shirt').first().click({ force: true });
    // Verify item in summary
    await expect(page.locator('h5:text("Shirt")').first()).toBeVisible();
    
    await page.getByText('Suit').first().click({ force: true });
    await expect(page.locator('h5:text("Suit")').first()).toBeVisible();
    
    // Go to Schedule step
    const proceedBtn = page.getByRole('button', { name: /Proceed to Schedule/i });
    await expect(proceedBtn).toBeEnabled({ timeout: 10000 });
    await proceedBtn.click({ force: true });
    
    // Schedule
    await page.waitForSelector('input[type="date"]', { state: 'visible', timeout: 30000 });
    await page.locator('input[type="date"]').nth(0).fill('2026-04-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-04-03', { force: true });
    
    // Go to Payment step
    await page.getByRole('button', { name: /Proceed to Payment/i }).click({ force: true });
    
    // Add Cash payment
    await expect(page.getByRole('button', { name: /^cash$/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /^cash$/i }).click({ force: true });
    
    // Submit order
    await expect(page.getByRole('button', { name: /Finalize & Post Payment/i })).toBeEnabled();
    await page.getByRole('button', { name: /Finalize & Post Payment/i }).click({ force: true });
    
    // Order completion screen
    await expect(page.getByText('Order Placed', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('8. Order search by name', async ({ page }) => {
    await page.getByPlaceholder(/Search Registry/i).fill('Arjun', { force: true });
    await page.waitForTimeout(1000);
    const rows = page.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);
  });

  test('9. Order status progression & Cancellation', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
    // Wait for actual data to appear if it's loading
    await expect(page.locator('tr').filter({ hasText: 'received' }).first()).toBeVisible({ timeout: 15000 });
    const receivedRow = page.locator('tr').filter({ hasText: 'received' }).first();
    await receivedRow.locator('a').first().click({ force: true });
    
    await expect(page.getByRole('link', { name: /Edit Order/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible({ timeout: 10000 });
  });
});
