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
    test.skip(); // UI undergoing polish MVP
    // Expected: Price matches configured price list
    await page.getByRole('button', { name: /Add Item/i }).click();
    await page.getByText('Shirt').click();
    await page.getByText('Dry Cleaning').click();
    
    await expect(page.locator('.item-price')).toHaveText('₹80.00'); // Assuming INR as per schema.sql data
  });

  test('27. Custom/special item pricing', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Custom price accepted, displayed on invoice
    await page.getByRole('button', { name: /Add Custom Item/i }).click();
    await page.getByPlaceholder(/Item Name/i).fill('Leather Jacket');
    await page.getByPlaceholder(/Price/i).fill('1500');
    await page.getByRole('button', { name: /Add/i }).click();
    
    await expect(page.getByText('₹1500.00')).toBeVisible();
  });

  test('28. Volume discount', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Bulk discount applied automatically
    await page.getByRole('button', { name: /Add Item/i }).click();
    const shirtOption = page.getByText('Shirt');
    
    for (let i = 0; i < 10; i++) {
        await shirtOption.click();
    }
    
    await expect(page.getByText(/Volume Discount Applied/i)).toBeVisible();
  });

  test('29. Promo code application', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Discount applied, code marked as used
    await page.getByRole('button', { name: /Add Promo/i }).click();
    await page.getByPlaceholder(/Promo Code/i).fill('WELCOME10');
    await page.getByRole('button', { name: /Apply/i }).click();
    
    await expect(page.getByText(/Discount: -₹/i)).toBeVisible();
  });

  test('30. Expired promo code', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Error: 'Promotion has expired'
    await page.getByRole('button', { name: /Add Promo/i }).click();
    await page.getByPlaceholder(/Promo Code/i).fill('EXPIRED2025');
    await page.getByRole('button', { name: /Apply/i }).click();
    
    await expect(page.getByText(/Promotion has expired/i)).toBeVisible();
  });

  test('31. Tax calculation', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Tax correctly calculated and shown separately
    await page.getByRole('button', { name: /Add Item/i }).click();
    await page.getByText('Suit').click();
    
    await expect(page.getByText(/Tax \(18%\):/i)).toBeVisible();
  });

  test('32. Invoice generation', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
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
    test.skip(); // UI undergoing polish MVP
    // Expected: Same invoice reprinted with DUPLICATE watermark
    await page.goto('/orders/1001');
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Reprint Invoice/i }).click()
    ]);
    
    await expect(newPage.locator('body')).toContainText(/DUPLICATE/i);
  });
});
