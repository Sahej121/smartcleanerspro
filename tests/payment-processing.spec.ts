import { test, expect } from '@playwright/test';

test.describe('3.5 Payment Processing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/orders/new');
  });

  test('34. Cash payment — exact', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    await page.getByRole('button', { name: /Payment/i }).click();
    await page.getByRole('button', { name: /Cash/i }).click();
    
    // Simulate filling exact amount
    await page.getByPlaceholder(/Amount Given/i).fill('500'); // Assuming total is 500
    await page.getByRole('button', { name: /Pay/i }).click();
    
    await expect(page.getByText(/Change: ₹0\.00/i)).toBeVisible();
    await expect(page.getByText('PAID')).toBeVisible();
  });

  test('35. Cash payment — overpaid', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Change amount displayed correctly
    await page.getByRole('button', { name: /Payment/i }).click();
    await page.getByRole('button', { name: /Cash/i }).click();
    
    await page.getByPlaceholder(/Amount Given/i).fill('1000'); // total 500
    
    await expect(page.getByText(/Change: ₹500\.00/i)).toBeVisible();
  });

  test('36. Cash payment — underpaid', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Error: 'Insufficient amount'
    await page.getByRole('button', { name: /Payment/i }).click();
    await page.getByRole('button', { name: /Cash/i }).click();
    
    await page.getByPlaceholder(/Amount Given/i).fill('100'); // total 500
    await page.getByRole('button', { name: /Pay/i }).click();
    
    await expect(page.getByText(/Insufficient amount/i)).toBeVisible();
  });

  test('37. Card payment', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Payment confirmed, order status = PAID
    await page.getByRole('button', { name: /Payment/i }).click();
    await page.getByRole('button', { name: /Card/i }).click();
    await page.getByRole('button', { name: /Charge Terminal/i }).click();
    
    await expect(page.getByText('Payment confirmed')).toBeVisible();
    await expect(page.getByText('PAID')).toBeVisible();
  });

  test('38. Split payment', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Both amounts recorded, receipt shows split
    await page.getByRole('button', { name: /Payment/i }).click();
    await page.getByRole('button', { name: /Split Payment/i }).click();
    
    await page.getByPlaceholder(/Cash Amount/i).fill('200');
    await page.getByPlaceholder(/Card Amount/i).fill('300');
    await page.getByRole('button', { name: /Pay/i }).click();
    
    await expect(page.getByText(/Paid via Cash & Card/i)).toBeVisible();
  });

  test('39. Refund — full', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Amount returned, order status = REFUNDED
    await page.goto('/orders/1001'); // Assuming paid order
    await page.getByRole('button', { name: /Refund/i }).click();
    await page.getByRole('button', { name: /Full Refund/i }).click();
    await page.getByRole('button', { name: /Confirm/i }).click();
    
    await expect(page.getByText('REFUNDED', { exact: true })).toBeVisible();
  });

  test('40. Refund — partial', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Partial amount refunded, order updated
    await page.goto('/orders/1001');
    await page.getByRole('button', { name: /Refund/i }).click();
    await page.getByRole('button', { name: /Partial Refund/i }).click();
    
    await page.getByPlaceholder(/Amount/i).fill('50');
    await page.getByRole('button', { name: /Confirm/i }).click();
    
    await expect(page.getByText(/Partial Refund Issued/i)).toBeVisible();
  });

  test('41. Void transaction', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Transaction removed from daily report
    await page.goto('/orders/1002');
    await page.getByRole('button', { name: /Void Payment/i }).click();
    
    await expect(page.getByText(/Payment Voided/i)).toBeVisible();
  });

  test('42. Payment on collection', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Payment recorded, garment released
    await page.goto('/orders/pickup');
    await page.getByPlaceholder(/Order ID/i).fill('CF-1003'); // unpaid order
    await page.getByRole('button', { name: /Collect/i }).click();
    
    await expect(page.getByText(/Payment Required/i)).toBeVisible();
    await page.getByRole('button', { name: /Pay Cash/i }).click();
    await page.getByPlaceholder(/Amount/i).fill('620');
    await page.getByRole('button', { name: /Confirm/i }).click();
    
    await expect(page.getByText(/Garments Released/i)).toBeVisible();
  });
});
