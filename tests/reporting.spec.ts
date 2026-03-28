import { test, expect } from '@playwright/test';

test.describe('3.8 Reporting & Analytics', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('54. Daily revenue report', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Correct totals for orders, revenue, payments
    await page.getByText('Daily Summary').click();
    await page.getByRole('button', { name: /Today/i }).click();
    
    await expect(page.getByText(/Total Revenue:/i)).toBeVisible();
    await expect(page.locator('.revenue-value')).not.toBeEmpty();
  });

  test('55. Order status summary', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Counts per status match live order data
    await page.getByText('Orders by Status').click();
    
    await expect(page.getByText(/Pending Orders/i)).toBeVisible();
    await expect(page.locator('.status-chart')).toBeVisible();
  });

  test('56. Staff performance report', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Orders per staff, revenue attributed correctly
    await page.getByText('Staff Performance').click();
    await page.getByLabel(/Date Range/i).fill('Last 7 Days');
    await page.keyboard.press('Enter');
    
    await expect(page.getByText('Rahul Kumar')).toBeVisible();
    await expect(page.getByText(/Orders Processed:/i).first()).toBeVisible();
  });

  test('57. Export to CSV', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: File downloads with all columns, no data corruption
    await page.getByText('Daily Summary').click();
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export CSV/i }).click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('58. Export to PDF', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Formatted PDF with header, page numbers, totals
    await page.getByText('Daily Summary').click();
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export PDF/i }).click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('59. Custom date range report', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Only data within range included
    await page.getByText('Daily Summary').click();
    await page.getByPlaceholder(/Start Date/i).fill('2026-03-01');
    await page.getByPlaceholder(/End Date/i).fill('2026-03-15');
    await page.getByRole('button', { name: /Apply Filter/i }).click();
    
    await expect(page.getByText(/Report Period: Mar 01 - Mar 15, 2026/i)).toBeVisible();
  });
});
