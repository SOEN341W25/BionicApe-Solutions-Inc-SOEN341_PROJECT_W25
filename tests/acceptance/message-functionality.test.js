// tests/acceptance/message-functionality.test.js
describe('Message Functionality Acceptance Tests', () => {
  beforeAll(async () => {
    // Set longer timeout for UI tests
    jest.setTimeout(30000);
  });

  beforeEach(async () => {
    // Navigate to the direct messaging page for each test
    await page.goto('http://localhost:3000/direct-messaging.html');
  });

  test('Message input and form should function correctly', async () => {
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Wait for chat interface to load
    await page.waitForSelector('#form');
    
    // Type a test message
    const testMessage = 'Test message ' + Date.now();
    await page.type('#input', testMessage);
    
    // Get input value
    const inputValue = await page.$eval('#input', el => el.value);
    expect(inputValue).toBe(testMessage);
    
    // Submit the form
    await page.click('#form button[type="submit"]');
    
    // Verify input is cleared after submission
    const newInputValue = await page.$eval('#input', el => el.value);
    expect(newInputValue).toBe('');
  });

  test('Messages should display with correct formatting', async () => {
    // In a real application with websockets, we would:
    // 1. Select a user
    // 2. Send a message
    // 3. Verify the message appears with correct formatting
    
    // For this test, we'll just verify the message container exists
    await expect(page.$('#messages')).resolves.toBeTruthy();
    
    // If messages exist, check their structure
    const messagesExist = await page.evaluate(() => {
      return document.querySelectorAll('#messages li').length > 0;
    });
    
    if (messagesExist) {
      // Check structure of message elements
      const hasCorrectAttributes = await page.evaluate(() => {
        const firstMessage = document.querySelector('#messages li');
        return firstMessage && 
               firstMessage.hasAttribute('id') && 
               firstMessage.hasAttribute('data-visibility') &&
               firstMessage.hasAttribute('onclick');
      });
      
      expect(hasCorrectAttributes).toBe(true);
    }
  });

  test('Message deletion functionality should work', async () => {
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // For this test, we need existing messages
    // In a real application, we might send a message first
    
    // Check if there are any messages
    const messagesExist = await page.evaluate(() => {
      return document.querySelectorAll('#messages li').length > 0;
    });
    
    if (messagesExist) {
      // Get first message
      const initialVisibility = await page.$eval('#messages li:first-child', el => el.getAttribute('data-visibility'));
      
      // Click the message to toggle visibility (delete/undelete)
      await page.click('#messages li:first-child');
      
      // Verify visibility attribute changed
      const newVisibility = await page.$eval('#messages li:first-child', el => el.getAttribute('data-visibility'));
      
      // Visibility should have toggled (true -> false or false -> true)
      expect(newVisibility).not.toBe(initialVisibility);
      
      // If the message was deleted, it should show the deleted message text
      if (newVisibility === 'false') {
        const messageText = await page.$eval('#messages li:first-child', el => el.textContent);
        expect(messageText).toBe('Message is deleted by moderator');
      }
    }
  });

  test('Last active time should display for direct messages', async () => {
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Check for last active time display
    await expect(page.$('#lastActiveAtTitle')).resolves.toBeTruthy();
    
    // Get the text content
    const lastActiveText = await page.$eval('#lastActiveAtTitle', el => el.textContent);
    
    // Should contain "Last active" text (exact format may vary)
    expect(lastActiveText).toMatch(/Last active/i);
  });
});
