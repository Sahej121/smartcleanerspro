import { test, expect } from '@playwright/test';

// Helper: standard login for staff
async function loginAsStaff(page) {
  await page.goto('/login');
  await page.getByPlaceholder('Email or phone reference').fill('priya@cleanflow.com', { force: true });
  await page.getByPlaceholder('••••••••').fill('staff1234', { force: true });
  await page.getByRole('button', { name: 'AUTHORIZE ACCESS' }).click({ force: true });
  await page.waitForURL('/', { timeout: 60000 });
}

// Helper: navigate to new order, select customer, add a garment, and reach payment step
async function navigateToPaymentStep(page, garmentName = 'Shirt') {
  await page.goto('/orders/new');
  await page.waitForLoadState('networkidle');

  // Select customer
  await page.click('text=Assign Customer', { force: true });
  await page.locator('input[placeholder="Start typing..."]').fill('Arjun Mehta', { force: true });
  await page.click('text=Arjun Mehta', { force: true });

  // Wait for garment grid to be visible
  await expect(page.getByRole('heading', { name: 'Select Garments', level: 3 })).toBeVisible({ timeout: 10000 });

  // Click a garment CARD in the grid
  await page.locator(`.grid h4:has-text("${garmentName}")`).first().click({ force: true });

  // Wait for item to appear in cart and enable proceed button
  await expect(page.locator('button:has-text("Proceed to Schedule")').first()).toBeEnabled({ timeout: 15000 });
  await page.click('text=Proceed to Schedule', { force: true });

  // Fill schedule dates
  await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="date"]').nth(0).fill('2026-05-01', { force: true });
  await page.locator('input[type="date"]').nth(1).fill('2026-05-03', { force: true });
  await page.click('text=Proceed to Payment', { force: true });

  // Wait for payment step
  await expect(page.getByText('Payment Settlement')).toBeVisible({ timeout: 15000 });
}

// Helper: finalize order and wait for success screen, then click Track Order
async function finalizeAndTrackOrder(page) {
  await page.click('text=Finalize & Post Payment', { force: true });
  
  // Wait for success screen
  await expect(page.getByRole('heading', { name: /Order Placed/i })).toBeVisible({ timeout: 60000 });
  
  // Click Track Order to go to order detail page
  await page.click('button:has-text("Track Order")', { force: true });
  
  // Now verify we are on an order detail page (URL should have /orders/CF-)
  await page.waitForURL(/\/orders\/\d+|CF-/, { timeout: 20000 });
}

// Separate helper for "Pay at Pickup" which has different button text
async function finalizePayAtPickup(page) {
  await page.click('text=Create Order (Pending)', { force: true });
  
  // Wait for success screen
  await expect(page.getByRole('heading', { name: /Order Placed/i })).toBeVisible({ timeout: 60000 });
  
  // Click Track Order
  await page.click('button:has-text("Track Order")', { force: true });
  
  // Verify order details page
  await page.waitForURL(/\/orders\/\d+|CF-/, { timeout: 20000 });
}

test.describe('Advanced Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000); // Higher timeout for complex end-to-end flows
    await loginAsStaff(page);
  });

  test('Cash payment with change calculation', async ({ page }) => {
    await navigateToPaymentStep(page, 'Shirt');
    
    // Select cash payment method
    await page.click('button:has-text("cash")', { force: true });
    
    // Find the tendered input and enter amount
    const tenderedInput = page.locator('input[placeholder="Enter amount..."]');
    await expect(tenderedInput).toBeVisible({ timeout: 10000 });
    await tenderedInput.fill('500', { force: true });
    
    // Check change calculation in UI
    const changeDisplay = page.locator('text=Return Change');
    await expect(changeDisplay).toBeVisible({ timeout: 10000 });
    
    await finalizeAndTrackOrder(page);
    
    // Verify paid status
    await expect(page.locator('text=paid')).toBeVisible({ timeout: 15000 });
  });

  test('Split payment (Cash + Card)', async ({ page }) => {
    await navigateToPaymentStep(page, 'Suit');

    // Add Cash payment
    await page.click('button:has-text("cash")', { force: true });
    // Modify cash amount to a partial amount
    const cashAmountInput = page.locator('input[type="number"]').first();
    await cashAmountInput.fill('500', { force: true });
    
    // Add Card for remaining
    await page.click('button:has-text("card")', { force: true });
    
    await finalizeAndTrackOrder(page);
    
    // Verify paid status on detail page
    await expect(page.locator('text=paid')).toBeVisible({ timeout: 15000 });
  });

  test('Pay on Collection flow', async ({ page }) => {
    // Use "Trousers" since "Pant" doesn't exist 
    await navigateToPaymentStep(page, 'Trousers');
    
    // Toggle Pay at Collection
    await page.click('text=Pay at Collection', { force: true });
    
    await finalizePayAtPickup(page);
    
    // Verify pending status
    await expect(page.locator('text=pending')).toBeVisible({ timeout: 15000 });
    
    // Collect Payment via modal on order detail page
    await page.click('text=Collect Payment', { force: true });
    
    // In the payment modal, click "Post Payment"
    await page.click('button:has-text("Post Payment")', { force: true });
    
    // Confirm it changed to paid
    await expect(page.locator('text=paid')).toBeVisible({ timeout: 15000 });
  });

  test('Refund flow', async ({ page }) => {
    await navigateToPaymentStep(page, 'Shirt');

    // Pay with card
    await page.click('button:has-text("card")', { force: true });
    await finalizeAndTrackOrder(page);
    
    await expect(page.locator('text=paid')).toBeVisible({ timeout: 15000 });
    
    // Process Refund
    await page.click('text=Process Refund', { force: true });
    
    // Fill reason and confirm
    await page.fill('textarea', 'Test refund', { force: true });
    await page.click('button:has-text("Confirm Refund")', { force: true });
    
    await expect(page.locator('text=refunded')).toBeVisible({ timeout: 15000 });
  });
});
