import { test } from '@playwright/test';

test('CleanFlow Demo Recording', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes
  
  // Set a fixed viewport for a clean recording
  await page.setViewportSize({ width: 1280, height: 720 });

  // 1. Login
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[placeholder*="Email"]', { timeout: 30000 });
  await page.fill('input[placeholder*="Email"]', 'priya@cleanflow.com');
  await page.fill('input[type="password"]', 'staff1234');
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/admin/dashboard', { timeout: 30000 });
  await page.waitForTimeout(8000);

  // 2. Settings -> Language (Showcase Māori)
  await page.goto('http://localhost:3000/admin/settings');
  await page.waitForSelector('button:has-text("Language")', { timeout: 20000 });
  await page.click('button:has-text("Language")');
  await page.waitForTimeout(3000);
  
  // Select Māori
  await page.click('button:has-text("Te Reo Māori")');
  
  // Wait for the UI to reflect the change (Language -> Reo)
  await page.waitForSelector('button:has-text("Reo")', { timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // 3. Showcase Multi-Store Tab (Localized in Māori as 'Toa')
  await page.click('button:has-text("Toa")'); 
  await page.waitForTimeout(10000);
  
  // Switch back to English
  await page.click('button:has-text("Reo")'); 
  await page.click('button:has-text("English")');
  await page.waitForSelector('button:has-text("Language")', { timeout: 20000 });
  await page.waitForTimeout(4000);

  // 4. Create a New Order (Rapid workflow)
  await page.goto('http://localhost:3000/orders/new');
  await page.waitForTimeout(5000);
  
  // Select Customer
  await page.click('button:has-text("Create & Select")'); 
  await page.fill('input[placeholder="Full Name"]', 'Demo Customer');
  await page.fill('input[placeholder="Phone Number"]', '98765' + Math.floor(Math.random() * 90000));
  await page.fill('input[placeholder*="Address"]', '123 MG Road, New Delhi');
  await page.click('button:has-text("Save & Assign")'); 
  await page.waitForTimeout(8000);

  // Add Items
  await page.click('button:has-text("Shirt")');
  await page.click('button:has-text("Dry Cleaning")');
  await page.waitForTimeout(3000);
  await page.click('button:has-text("Suit")');
  await page.click('button:has-text("Washing")');
  await page.waitForTimeout(6000);

  // 5. Review & Finish
  await page.click('button:has-text("Proceed to Schedule")'); 
  await page.waitForTimeout(5000);
  
  // Set Dates (using standard input)
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await page.fill('input[type="date"] >> nth=0', today);
  await page.fill('input[type="date"] >> nth=1', nextWeek);
  
  await page.click('button:has-text("Proceed to Payment")');
  await page.waitForTimeout(5000);
  
  await page.click('button:has-text("Pay")');
  
  // Final celebration pause
  await page.waitForTimeout(10000);
});
