// tests/acceptance/user-interface.test.js
describe('User Interface Acceptance Tests', () => {
  beforeAll(async () => {
    // Set longer timeout for UI tests
    jest.setTimeout(30000);
  });

  beforeEach(async () => {
    // Navigate to the direct messaging page for each test
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForSelector('.sidebar');
  });

  test('Homepage should load with sidebar and proper structure', async () => {
    // Check for main UI elements
    await expect(page.$('.sidebar')).resolves.toBeTruthy();
    await expect(page.$('#btn')).resolves.toBeTruthy();
    await expect(page.$('.bx-search')).resolves.toBeTruthy();
    await expect(page.$('#renderList')).resolves.toBeTruthy();
  });

  test('Sidebar toggle should work correctly', async () => {
    // Check initial state (could be open or closed)
    const initialState = await page.$eval('.sidebar', el => el.classList.contains('open'));
    
    // Click the toggle button
    await page.click('#btn');
    
    // Verify state has changed
    const updatedState = await page.$eval('.sidebar', el => el.classList.contains('open'));
    expect(updatedState).not.toBe(initialState);
    
    // Click again to revert
    await page.click('#btn');
    
    // Verify returned to initial state
    const finalState = await page.$eval('.sidebar', el => el.classList.contains('open'));
    expect(finalState).toBe(initialState);
  });

  test('User list should display users', async () => {
    // Wait for user list to load
    await page.waitForSelector('#renderList');
    
    // Get number of users displayed
    const userCount = await page.$$eval('#renderList li', items => items.length);
    
    // There should be at least one user (from mocked data)
    expect(userCount).toBeGreaterThan(0);
  });

  test('Selecting a user should display chat interface', async () => {
    // Wait for user list to load
    await page.waitForSelector('#renderList li a');
    
    // Select the first user in the list
    await page.click('#renderList li a');
    
    // Check that chat interface elements appear
    await page.waitForSelector('#currentChatBoxTitle');
    await expect(page.$('#messages')).resolves.toBeTruthy();
    await expect(page.$('#form')).resolves.toBeTruthy();
    await expect(page.$('#input')).resolves.toBeTruthy();
    
    // Verify recipient name is displayed
    const recipientName = await page.$eval('#currentChatBoxTitle', el => el.textContent);
    expect(recipientName.trim().length).toBeGreaterThan(0);
  });

  test('Direct messaging form should allow sending messages', async () => {
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Wait for chat interface to load
    await page.waitForSelector('#form');
    
    // Type a test message
    const testMessage = 'This is a test message ' + Date.now();
    await page.type('#input', testMessage);
    
    // Submit the form
    await page.click('#form button[type="submit"]');
    
    // Verify input is cleared (indicating submission)
    const inputValue = await page.$eval('#input', el => el.value);
    expect(inputValue).toBe('');
  });

  test('User status should be displayed', async () => {
    // Wait for user list to load
    await page.waitForSelector('#renderList li');
    
    // Check that status indicators exist
    const statusElements = await page.$$('.userStatus, .userStatus_online');
    expect(statusElements.length).toBeGreaterThan(0);
    
    // Check at least one user has a status text
    const hasStatus = await page.evaluate(() => {
      const statuses = document.querySelectorAll('.userStatus, .userStatus_online');
      return Array.from(statuses).some(el => el.textContent.trim().length > 0);
    });
    
    expect(hasStatus).toBe(true);
  });

  test('Last active time should appear when selecting a user', async () => {
    // Wait for user list to load
    await page.waitForSelector('#renderList li a');
    
    // Select the first user in the list
    await page.click('#renderList li a');
    
    // Wait for last active element
    await page.waitForSelector('#lastActiveAtTitle');
    
    // Verify the last active text contains expected format
    const lastActiveText = await page.$eval('#lastActiveAtTitle', el => el.textContent);
    expect(lastActiveText).toMatch(/Last active/);
  });
});
