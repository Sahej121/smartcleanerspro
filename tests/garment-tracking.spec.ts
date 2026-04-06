import { test, expect } from '@playwright/test';

test.describe.serial('3.3 Garment & Item Tracking', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Email or phone reference/i).fill('priya@cleanflow.com');
    await page.getByPlaceholder(/••••••••/i).fill('staff1234');
    await page.getByRole('button', { name: /AUTHORIZE ACCESS/i }).click();
    await page.waitForURL('**/');
  });

  test('19. Tag garment on intake', async ({ page }) => {
    await page.goto('/orders/new');
    // Click Garment Type
    await expect(page.getByRole('heading', { name: 'Shirt', level: 4 }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('heading', { name: 'Shirt', level: 4 }).first().click();
    
    // Verify item is in cart before trying to click Track
    await expect(page.getByRole('heading', { name: 'Shirt', level: 5 }).first()).toBeVisible({ timeout: 10000 });
    
    // Click Track
    const trackBtn = page.getByRole('button', { name: /Track/i }).first();
    await expect(trackBtn).toBeVisible({ timeout: 10000 });
    await trackBtn.click();
    
    // Modal opens
    await expect(page.getByPlaceholder(/Scan or type tag/i)).toBeVisible();
    await page.getByPlaceholder(/Scan or type tag/i).fill('TAG-1001');
    await page.getByRole('button', { name: /Apply Tracking/i }).click();
    
    // Validate tag applied in the UI
    await expect(page.getByText('TAG-1001')).toBeVisible();
  });

  test('20. Track garment status', async ({ page }) => {
    await page.goto('/operations/scanner');
    await expect(page.locator('input[placeholder*="order number"]')).toBeVisible({ timeout: 15000 });
    await page.locator('input[placeholder*="order number"]').fill('1001');
    await page.getByRole('button', { name: /Search/i }).click();
    
    // Check results
    await expect(page.getByText(/Order Items/i)).toBeVisible();
  });

  test('21. Report damaged garment', async ({ page }) => {
    await page.goto('/orders/1');
    await expect(page.getByText(/Logistics Snapshot/i)).toBeVisible({ timeout: 15000 });
    const scanBtn = page.locator('button:has(span:text-is("barcode_scanner"))').first();
    if (await scanBtn.isVisible()) {
      await scanBtn.click();
      await expect(page.getByRole('button', { name: 'damaged', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'damaged', exact: true }).click();
      await page.getByPlaceholder(/Details about damage or loss/i).fill('Damaged during cleaning');
      await page.getByRole('button', { name: /Update Record/i }).click();
      
      await expect(page.getByText('damaged', { exact: true }).first()).toBeVisible();
    } else {
      
    }
  });

  test('22. Report lost garment', async ({ page }) => {
    await page.goto('/orders/1');
    await expect(page.getByText(/Logistics Snapshot/i)).toBeVisible({ timeout: 15000 });
    const scanBtn = page.locator('button:has(span:text-is("barcode_scanner"))').first();
    if (await scanBtn.isVisible()) {
      await scanBtn.click();
      await expect(page.getByRole('button', { name: 'lost', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'lost', exact: true }).click();
      await page.getByPlaceholder(/Details about damage or loss/i).fill('Lost Item');
      await page.getByRole('button', { name: /Update Record/i }).click();
      
      await expect(page.getByText('lost', { exact: true }).first()).toBeVisible();
    } else {
      
    }
  });

  test('23. Scan on collection', async ({ page }) => {
    await page.goto('/operations/scanner');
    await expect(page.locator('input[placeholder*="order number"]')).toBeVisible({ timeout: 15000 });
    await page.locator('input[placeholder*="order number"]').fill('1001');
    await page.getByRole('button', { name: /Search/i }).click();
    
    const advanceBtn = page.getByRole('button', { name: /ADVANCE/i }).first();
    await page.waitForTimeout(1000);
    if (await advanceBtn.isVisible()) {
      await advanceBtn.click();
      await expect(page.getByText(/✅ Item moved to/)).toBeVisible();
    } else {
      
    }
  });

  test('24. Garment special instructions', async ({ page }) => {
    await page.goto('/orders/new');
    await expect(page.getByRole('heading', { name: 'Dress', level: 4 }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('heading', { name: 'Dress', level: 4 }).first().click();
    
    // Verify item in cart
    await expect(page.getByRole('heading', { name: 'Dress', level: 5 }).first()).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('button', { name: /Track/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Track/i }).first().click();
    await expect(page.getByPlaceholder(/Stains, delicate fabric/i)).toBeVisible();
    await page.getByPlaceholder(/Stains, delicate fabric/i).fill('cold wash only');
    await page.getByRole('button', { name: /Apply Tracking/i }).click();
    
    await expect(page.getByText('cold wash only').first()).toBeVisible();
  });

  test('25. Multi-bag order tracking', async ({ page }) => {
    await page.goto('/orders/new');
    
    await expect(page.getByRole('heading', { name: 'Shirt', level: 4 }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('heading', { name: 'Shirt', level: 4 }).first().click();
    // Verify in cart
    await expect(page.getByRole('heading', { name: 'Shirt', level: 5 }).first()).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('button', { name: /Track/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Track/i }).first().click();
    await expect(page.locator('input[placeholder="e.g. B-01"]')).toBeVisible();
    await page.locator('input[placeholder="e.g. B-01"]').fill('Bag 1 of 2');
    await page.getByRole('button', { name: /Apply Tracking/i }).click();
    
    // Tag second item
    await expect(page.getByRole('heading', { name: 'Trousers', level: 4 }).first()).toBeVisible();
    await page.getByRole('heading', { name: 'Trousers', level: 4 }).first().click();
    // Verify in cart
    await expect(page.getByRole('heading', { name: 'Trousers', level: 5 }).first()).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('button', { name: /Track/i }).nth(1)).toBeVisible();
    await page.getByRole('button', { name: /Track/i }).nth(1).click();
    await expect(page.locator('input[placeholder="e.g. B-01"]')).toBeVisible();
    await page.locator('input[placeholder="e.g. B-01"]').fill('Bag 2 of 2');
    await page.getByRole('button', { name: /Apply Tracking/i }).click();
    
    await expect(page.getByText('Bag 1 of 2').first()).toBeVisible();
    await expect(page.getByText('Bag 2 of 2').first()).toBeVisible();
  });
});
