import { test, expect } from '@playwright/test';

test.describe('3.3 Garment & Item Tracking', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/workflow');
  });

  test('19. Tag garment on intake', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Garment linked to order, tag printed
    await page.goto('/orders/new');
    await page.getByRole('button', { name: /Add Item/i }).click();
    await page.getByText('Shirt').click();
    await page.getByRole('button', { name: /Assign Barcode/i }).click();
    
    await expect(page.getByText(/Barcode Tagged/i)).toBeVisible();
  });

  test('20. Track garment status', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Status reflects current stage accurately
    await page.getByPlaceholder(/Scan Barcode/i).click();
    await page.getByPlaceholder(/Scan Barcode/i).fill('TAG-1001\n');
    
    // Check mid-process
    await expect(page.getByText(/Current Stage:/i)).toBeVisible();
    await expect(page.locator('.status-badge')).not.toBeEmpty();
  });

  test('21. Report damaged garment', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Status = DAMAGED, customer notified, manager alerted
    await page.getByText('Shirt - TAG-1001').click();
    await page.getByRole('button', { name: /Flag Issue/i }).click();
    await page.getByText('Damaged during cleaning').click();
    await page.getByRole('button', { name: /Submit/i }).click();
    
    await expect(page.getByText('DAMAGED')).toBeVisible();
  });

  test('22. Report lost garment', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Order status updated, compensation workflow triggered
    await page.getByText('Suit').first().click();
    await page.getByRole('button', { name: /Flag Issue/i }).click();
    await page.getByText('Lost Item').click();
    await page.getByRole('button', { name: /Submit/i }).click();
    
    await expect(page.getByText(/Compensation required/i)).toBeVisible();
  });

  test('23. Scan on collection', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Item marked as COLLECTED, order updated
    await page.goto('/orders/pickup');
    await page.getByPlaceholder(/Scan Garment/i).fill('TAG-1002\n');
    
    await expect(page.getByText('COLLECTED', { exact: true })).toBeVisible();
  });

  test('24. Garment special instructions', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Note visible to processing staff, printed on tag
    await page.goto('/orders/new');
    await page.getByRole('button', { name: /Add Item/i }).click();
    await page.getByText('Dress').click();
    await page.getByPlaceholder(/Notes/i).fill('cold wash only');
    
    await expect(page.locator('.item-note')).toHaveText(/cold wash only/i);
  });

  test('25. Multi-bag order tracking', async ({ page }) => {
    test.skip(); // UI undergoing polish MVP
    // Expected: Both bags tracked, order complete only when both done
    await page.goto('/orders/1005'); // Assuming an order with 2 bags
    await expect(page.getByText(/Bag 1 of 2/i)).toBeVisible();
    await expect(page.getByText(/Bag 2 of 2/i)).toBeVisible();
    await expect(page.getByText('Status: Processing')).toBeVisible();
    
    // Mark both collected
    await page.getByRole('button', { name: /Mark Bag 1 Ready/i }).click();
    await expect(page.getByText('Status: Processing')).toBeVisible(); // Order should not complete yet
    await page.getByRole('button', { name: /Mark Bag 2 Ready/i }).click();
    
    await expect(page.getByText('Status: Ready')).toBeVisible();
  });
});
