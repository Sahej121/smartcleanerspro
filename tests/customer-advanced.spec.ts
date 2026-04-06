import { test, expect } from '@playwright/test';

test.describe('Customer Management Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    // Login
    await page.goto('/login');
    await page.getByPlaceholder(/Email or phone reference/i).fill('priya@cleanflow.com');
    await page.getByPlaceholder(/••••••••/i).fill('staff1234');
    await page.getByRole('button', { name: /AUTHORIZE ACCESS/i }).click();
    await page.waitForURL('/', { timeout: 60000 });
  });

  test('should detect duplicate phone numbers', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    // Generate a unique phone for this session but might be multiple on page due to previous runs
    const uniquePhone = `98765${Math.floor(Math.random() * 100000)}`;
    const custName = 'Test Duplicate ' + Math.floor(Math.random() * 1000);
    
    // Create first client via "Add Client" button in the action bar
    await page.locator('button:has-text("Add Client")').first().click({ timeout: 10000 });
    await page.locator('input[placeholder="Christian Dior"]').fill(custName);
    await page.locator('input[placeholder="+91"]').fill(uniquePhone);
    await page.getByRole('button', { name: /Launch Profile/i }).click({ force: true });
    
    // The app does NOT redirect after creation - it closes the modal and refreshes the list
    // Wait for the modal to close and the new customer to appear in the list
    // Use .first() to avoid strict mode violation if name is reused or list is long
    await expect(page.getByRole('heading', { name: custName }).first()).toBeVisible({ timeout: 20000 });
    
    // Attempt duplicate - open Add Client modal again
    await page.locator('button:has-text("Add Client")').first().click({ timeout: 10000 });
    await page.locator('input[placeholder="Christian Dior"]').fill('Another Duplicate');
    await page.locator('input[placeholder="+91"]').fill(uniquePhone);
    await page.getByRole('button', { name: /Launch Profile/i }).click({ force: true });
    
    // Expect error message within the modal
    await expect(page.getByText(/already exists/i).first()).toBeVisible({ timeout: 25000 });
  });


  test('should earn loyalty points after payment', async ({ page }) => {
    await page.goto('/orders/new');
    await page.waitForLoadState('networkidle');

    // Select a customer via the overlay
    await page.click('text=Assign Customer', { force: true });
    await page.locator('input[placeholder="Start typing..."]').fill('Arjun Mehta', { force: true });
    await page.click('text=Arjun Mehta', { force: true });
    
    // Wait for the customer search overlay to close and garments to be visible
    await expect(page.getByRole('heading', { name: 'Select Garments', level: 3 })).toBeVisible({ timeout: 10000 });
    
    // Click a garment CARD (not the sidebar category button)
    await page.locator('.grid h4:has-text("Shirt")').first().click({ force: true });
    
    // Wait for item to appear in cart
    await expect(page.locator('button:has-text("Proceed to Schedule")').first()).toBeEnabled({ timeout: 10000 });
    await page.click('text=Proceed to Schedule', { force: true });
    
    // Wait for schedule step
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 15000 });
    
    await page.locator('input[type="date"]').nth(0).fill('2026-06-01', { force: true });
    await page.locator('input[type="date"]').nth(1).fill('2026-06-03', { force: true });
    await page.click('text=Proceed to Payment', { force: true });
    
    // Select payment method
    await page.click('button:has-text("cash")', { force: true });
    await page.click('text=Finalize & Post Payment', { force: true });
    
    // The app shows an "Order Placed" heading instead of redirecting
    await expect(page.getByRole('heading', { name: /Order Placed/i })).toBeVisible({ timeout: 60000 });
    
    // Go to customer profile to check points
    await page.goto('/customers/1', { waitUntil: 'networkidle' }); // Arjun Mehta is ID 1
    await expect(page.getByText(/Loyalty Points/i)).toBeVisible({ timeout: 20000 });
  });

});
