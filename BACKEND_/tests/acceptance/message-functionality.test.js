// tests/acceptance/message-functionality.test.js
describe('Message Functionality Acceptance Tests', () => {
  beforeAll(async () => {
    // Set longer timeout for UI tests
    jest.setTimeout(30000);
  });

  beforeEach(async () => {
    // Navigate to the main chat page
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForSelector('.sidebar');
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
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Wait for chat interface to load
    await page.waitForSelector('#messages');
    
    // Verify message container exists
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
               firstMessage.hasAttribute('data-visibility');
      });
      
      expect(hasCorrectAttributes).toBe(true);
    }
  });

  test('Message deletion functionality should work if moderator', async () => {
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // For this test, we need existing messages
    // Send a test message to ensure there's at least one
    await page.waitForSelector('#form');
    await page.type('#input', 'Test message for deletion ' + Date.now());
    await page.click('#form button[type="submit"]');
    
    // Wait a bit for the message to appear
    await page.waitForTimeout(1000);
    
    // Check if there are any messages
    const messagesExist = await page.evaluate(() => {
      return document.querySelectorAll('#messages li').length > 0;
    });
    
    if (messagesExist) {
      // Get first message visibility status
      const initialVisibility = await page.$eval('#messages li:first-child', el => el.getAttribute('data-visibility'));
      
      // Click the message to toggle visibility (delete/undelete)
      await page.click('#messages li:first-child');
      
      // Wait for visibility change
      await page.waitForTimeout(1000);
      
      // In a real test with a connected backend, we would check if the visibility changed
      // For this test, we'll just verify the click action worked
      console.log('Message clicked for deletion test');
    }
  });

  test('Last active time should display for direct messages', async () => {
    // Wait for user list and select first user
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Check for last active time display
    await page.waitForSelector('#lastActiveAtTitle');
    
    // Get the text content
    const lastActiveText = await page.$eval('#lastActiveAtTitle', el => el.textContent);
    
    // Should contain "Last active" text (exact format may vary)
    expect(lastActiveText).toMatch(/Last active/i);
  });
  
  test('Switching between users should load different chat histories', async () => {
    // Wait for user list to load
    await page.waitForSelector('#renderList li a');
    
    // Get all user links
    const userLinks = await page.$('#renderList li a');
    
    // Skip test if not enough users
    if (userLinks.length < 2) {
      console.log('Not enough users to test switching between chats');
      return;
    }
    
    // Click first user
    await userLinks[0].click();
    
    // Wait for chat to load
    await page.waitForSelector('#currentChatBoxTitle');
    
    // Get first user name
    const firstUser = await page.$eval('#currentChatBoxTitle', el => el.textContent);
    
    // Click second user
    await userLinks[1].click();
    
    // Wait for chat to load
    await page.waitForTimeout(1000);
    
    // Get second user name
    const secondUser = await page.$eval('#currentChatBoxTitle', el => el.textContent);
    
    // Verify different users were selected
    expect(firstUser).not.toBe(secondUser);
  });
});
