import { test, expect } from '@playwright/test';

test.describe('Advanced Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    // Standard login
    await page.goto('/login');
    await page.getByPlaceholder('Email or phone reference').fill('owner@cleanflow.com', { force: true });
    await page.getByPlaceholder('••••••••').fill('owner123', { force: true });
    await page.getByRole('button', { name: 'AUTHORIZE ACCESS' }).click({ force: true });
    await page.waitForURL('**/', { timeout: 60000 });
  });

  test('Cash payment with change calculation', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Select customer
    await page.click('text=Proceed to Garments', { force: true });
    await page.locator('input[placeholder*="Search by name"]').fill('John Doe', { force: true });
    await page.click('text=John Doe', { force: true });
    
    // Add item (T-Shirt ₹250)
    await page.click('text=T-Shirt', { force: true });
    await page.click('text=Proceed to Schedule', { force: true });
    
    // Fill schedule
    await page.locator('input[type="date"]').nth(0).fill('2026-05-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-05-03', { force: true });
    await page.click('text=Proceed to Payment', { force: true });
    
    // Payment Step
    await page.click('button:has-text("cash")', { force: true });
    
    // Find the tendered input
    const tenderedInput = page.locator('input[placeholder="Enter amount..."]');
    await tenderedInput.fill('500', { force: true });
    
    // Check change calculation in UI
    const changeDisplay = page.locator('text=Return Change');
    await expect(changeDisplay).toBeVisible();
    
    await page.click('text=Finalize & Post Payment', { force: true });
    await page.waitForURL(/\/orders\/CF-/, { timeout: 60000 });
    
    // Verify paid status
    await expect(page.locator('text=paid')).toBeVisible();
  });

  test('Split payment (Cash + Card)', async ({ page }) => {
    await page.goto('/orders/new');
    await page.click('text=Proceed to Garments', { force: true });
    await page.locator('input[placeholder*="Search by name"]').fill('John Doe', { force: true });
    await page.click('text=John Doe', { force: true });
    await page.click('text=Suit', { force: true }); 
    await page.click('text=Proceed to Schedule', { force: true });
    await page.locator('input[type="date"]').nth(0).fill('2026-05-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-05-03', { force: true });
    await page.click('text=Proceed to Payment', { force: true });
    
    // Add Cash ₹500
    await page.click('button:has-text("cash")', { force: true });
    const cashAmountInput = page.locator('input[type="number"]').first();
    await cashAmountInput.fill('500', { force: true });
    
    // Add Card for remaining
    await page.click('button:has-text("card")', { force: true });
    
    await page.click('text=Finalize & Post Payment', { force: true });
    await page.waitForURL(/\/orders\/CF-/, { timeout: 60000 });
    
    // Verify paid status
    await expect(page.locator('text=paid')).toBeVisible();
  });

  test('Pay on Collection flow', async ({ page }) => {
    await page.goto('/orders/new');
    await page.click('text=Proceed to Garments', { force: true });
    await page.locator('input[placeholder*="Search by name"]').fill('John Doe', { force: true });
    await page.click('text=John Doe', { force: true });
    await page.click('text=Pants', { force: true }); 
    await page.click('text=Proceed to Schedule', { force: true });
    await page.locator('input[type="date"]').nth(0).fill('2026-05-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-05-03', { force: true });
    await page.click('text=Proceed to Payment', { force: true });
    
    // Toggle Pay at Collection
    await page.click('text=Pay at Collection', { force: true });
    
    await page.click('text=Create Order (Pending)', { force: true });
    await page.waitForURL(/\/orders\/CF-/, { timeout: 60000 });
    
    await expect(page.locator('text=pending')).toBeVisible();
    
    // Collect Payment
    await page.click('text=Collect Payment', { force: true });
    await page.click('button:has-text("Post Payment")', { force: true });
    
    await expect(page.locator('text=paid')).toBeVisible();
  });

  test('Refund flow', async ({ page }) => {
    await page.goto('/orders/new');
    await page.click('text=Proceed to Garments', { force: true });
    await page.locator('input[placeholder*="Search by name"]').fill('John Doe', { force: true });
    await page.click('text=John Doe', { force: true });
    await page.click('text=T-Shirt', { force: true });
    await page.click('text=Proceed to Schedule', { force: true });
    await page.locator('input[type="date"]').nth(0).fill('2026-05-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-05-03', { force: true });
    await page.click('text=Proceed to Payment', { force: true });
    await page.click('button:has-text("card")', { force: true });
    await page.click('text=Finalize & Post Payment', { force: true });
    await page.waitForURL(/\/orders\/CF-/, { timeout: 60000 });
    
    await expect(page.locator('text=paid')).toBeVisible();
    
    // Process Refund
    await page.click('text=Process Refund', { force: true });
    await page.fill('textarea', 'Test refund', { force: true });
    await page.click('button:has-text("Confirm Refund")', { force: true });
    
    await expect(page.locator('text=refunded')).toBeVisible();
  });
});
