import { test, expect } from '@playwright/test';

test.describe('Customer Management Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/Email or phone reference/i).fill('priya@cleanflow.com');
    await page.getByPlaceholder(/••••••••/i).fill('staff1234');
    await page.getByRole('button', { name: /AUTHORIZE ACCESS/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should detect duplicate phone numbers', async ({ page }) => {
    await page.goto('http://localhost:3000/customers');
    
    const uniquePhone = `98765${Math.floor(Math.random() * 100000)}`;
    await page.getByRole('button', { name: /Add Customer/i }).click();
    await page.getByPlaceholder(/Customer Name/i).fill('Test Duplicate');
    await page.getByPlaceholder(/\+91/i).fill(uniquePhone);
    await page.getByRole('button', { name: /Launch Profile/i }).click({ force: true });
    
    // Attempt duplicate
    await page.getByRole('button', { name: /Add Customer/i }).click({ force: true });
    await page.getByPlaceholder(/Customer Name/i).fill('Test Duplicate 2');
    await page.getByPlaceholder(/\+91/i).fill(uniquePhone);
    await page.getByRole('button', { name: /Launch Profile/i }).click({ force: true });
    
    // Expect error message
    await expect(page.getByText(/already exists/i).first()).toBeVisible({ timeout: 20000 });
  });

  test('should earn loyalty points after payment', async ({ page }) => {
    await page.goto('http://localhost:3000/customers');
    // Find a customer or create one
    const phone = `999${Math.floor(Math.random()*1000000)}`;
    await page.getByRole('button', { name: /Add Customer/i }).click();
    await page.getByPlaceholder(/Customer Name/i).fill('Loyalty User');
    await page.getByPlaceholder(/\+91/i).fill(phone);
    await page.getByRole('button', { name: /Launch Profile/i }).click({ force: true });
    
    // Get customer ID from list
    await page.waitForTimeout(2000);
    await page.getByRole('link', { name: /View Profile/i }).first().click({ force: true });
    await page.getByRole('link', { name: /New Order/i }).click({ force: true });
    
    // Add item (₹100+)
    await page.getByText(/Full Package/i).first().click();
    await page.getByText(/Premium Dry Clean Bundle/i).first().click(); // ₹999
    
    await page.getByRole('button', { name: /Review Order/i }).click();
    await page.getByRole('button', { name: /Confirm Schedule/i }).click();
    
    // Select payment (₹999)
    await page.getByRole('button', { name: /cash/i }).first().click();
    await page.getByRole('button', { name: /Finalize/i }).click();
    
    // Wait for success
    await expect(page.getByText(/Order Placed/i)).toBeVisible();
    
    // Check points (999 / 100 = 9 points)
    await page.getByRole('button', { name: /Track Order/i }).click();
    await page.getByRole('link', { name: /Loyalty User/i }).click();
    
    await expect(page.getByText(/Loyalty Points/i).locator('xpath=../h2')).toContainText('9');
  });
});
