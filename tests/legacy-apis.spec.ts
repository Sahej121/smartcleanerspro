import { test, expect } from '@playwright/test';

test.describe('Legacy API Routes', () => {

  test('System Logs API should run without crashing', async ({ request }) => {
    const response = await request.get('/api/system/logs');
    // It might be 401 if no auth, or 200 if it works. Just check it exists.
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  test('Support endpoints should run without crashing', async ({ request }) => {
    const response = await request.get('/api/support/tickets');
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  test('Tasks API should run without crashing', async ({ request }) => {
    const response = await request.get('/api/tasks');
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  test('Unused workflow validate endpoint', async ({ request }) => {
    const response = await request.post('/api/workflow/validate', {
       data: { items: [] }
    });
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });
});
