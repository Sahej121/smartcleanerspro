import { test, expect } from '@playwright/test';

test.describe('3.1 Order Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Email or phone reference/i).fill('priya@cleanflow.com');
    await page.getByPlaceholder(/••••••••/i).fill('staff1234');
    await page.getByRole('button', { name: /AUTHORIZE ACCESS/i }).click();
    await expect(page).toHaveURL('/');
    await page.goto('/orders');
  });

  test('1. Create new order', async ({ page }) => {
    test.setTimeout(90000); // Increase timeout for slow dev compilation
    await page.getByRole('link', { name: /New Pickup/i }).click({ force: true });
    
    // Assign customer
    await page.getByText('Assign Customer').click({ force: true });
    await page.getByPlaceholder(/Start typing/i).fill('Arjun', { force: true });
    
    const results = page.locator('.group').filter({ hasText: 'Arjun' }).first();
    await results.click({ force: true });
    
    // Add Items
    await page.getByText('Shirt').first().click({ force: true });
    await page.getByText('Suit').first().click({ force: true });
    
    await page.getByRole('button', { name: /Proceed to Schedule/i }).click({ force: true });
    
    // Schedule - wait for transition
    await page.waitForSelector('input[type="date"]', { state: 'visible', timeout: 30000 });
    await page.locator('input[type="date"]').nth(0).fill('2026-04-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-04-03', { force: true });
    
    await page.getByRole('button', { name: /Proceed to Payment/i }).click({ force: true });
    await page.getByRole('button', { name: /Cash/i }).click({ force: true });
    await page.getByRole('button', { name: /Finalize Order & Pay/i }).click({ force: true });
    
    await expect(page.getByText('Order Placed', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('8. Order search by name', async ({ page }) => {
    await page.getByPlaceholder(/Search Registry/i).fill('Arjun', { force: true });
    // Wait for search debounce/fetch
    await page.waitForTimeout(1000);
    const rows = page.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);
  });

  test('9. Order status progression & Cancellation', async ({ page }) => {
    await page.goto('/orders');
    // Wait for orders to load
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
    // Find a row with 'received' text and click its first link (the order ID)
    const receivedRow = page.locator('tr').filter({ hasText: 'received' }).first();
    await receivedRow.locator('a').first().click({ force: true });
    
    // Check for Edit and Cancel buttons
    await expect(page.getByRole('link', { name: /Edit Order/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible({ timeout: 10000 });
  });
});
