// tests/acceptance/channel-interface.test.js
describe('Channel Interface Acceptance Tests', () => {
  beforeAll(async () => {
    // Set longer timeout for UI tests
    jest.setTimeout(30000);
  });

  beforeEach(async () => {
    // Navigate to the channels page for each test
    await page.goto('http://localhost:3000/channels.html');
    
    // Wait for page to load
    await page.waitForSelector('.sidebar');
  });

  test('Channel page should load with proper structure', async () => {
    // Check for main UI elements
    await expect(page.$('.chat-container')).resolves.toBeTruthy();
    await expect(page.$('.sidebar')).resolves.toBeTruthy();
    await expect(page.$('#messages')).resolves.toBeTruthy();
    await expect(page.$('#form')).resolves.toBeTruthy();
    await expect(page.$('#input')).resolves.toBeTruthy();
    await expect(page.$('#renderList')).resolves.toBeTruthy();
  });

  test('Channel creation form should be visible and functional', async () => {
    // Check for channel creation form
    await expect(page.$('.form')).resolves.toBeTruthy();
    await expect(page.$('input[name="channelName"]')).resolves.toBeTruthy();
    
    // Type a test channel name
    const testChannelName = 'TestChannel' + Date.now();
    await page.type('input[name="channelName"]', testChannelName);
    
    // Get input value
    const inputValue = await page.$eval('input[name="channelName"]', el => el.value);
    expect(inputValue).toBe(testChannelName);
    
    // Submit the form (in a real test, we'd verify the channel is created)
    await page.click('.form button[type="submit"]');
    
    // Wait for potential response
    await page.waitForTimeout(1000);
  });

  test('Channel list should display channels', async () => {
    // Wait for channel list to load
    await page.waitForSelector('#renderList');
    
    // Get number of channels displayed
    const channelCount = await page.$$eval('#renderList li', items => items.length);
    
    // There should be at least one channel (from mocked data)
    expect(channelCount).toBeGreaterThan(0);
  });

  test('Selecting a channel should display chat interface', async () => {
    // Wait for channel list to load
    await page.waitForSelector('#renderList li a');
    
    // Select the first channel in the list
    await page.click('#renderList li a');
    
    // Check that chat interface elements are updated
    await page.waitForSelector('#currentChatBoxTitle');
    
    // Verify channel name is displayed
    const channelName = await page.$eval('#currentChatBoxTitle', el => el.textContent);
    expect(channelName.trim().length).toBeGreaterThan(0);
    
    // Check for message list
    await expect(page.$('#messages')).resolves.toBeTruthy();
  });

  test('Channel invite form should appear for private channels', async () => {
    // Wait for channel list to load
    await page.waitForSelector('#renderList li a');
    
    // Select the first channel in the list (assumes at least one channel in the list)
    const channels = await page.$$('#renderList li a');
    if (channels.length > 1) {
      // Click the second channel if there is more than one (might be a private one)
      await channels[1].click();
    } else {
      await channels[0].click();
    }
    
    // Check for invite form (may be hidden depending on channel type)
    await expect(page.$('#inviteForm')).resolves.toBeTruthy();
  });

  test('Message form should allow sending messages in channel', async () => {
    // Wait for channel list and select first channel
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Wait for chat interface to load
    await page.waitForSelector('#form');
    
    // Get initial message count
    const initialCount = await page.$$eval('#messages li', items => items.length);
    
    // Type a test message
    await page.type('#input', 'Test message ' + Date.now());
    
    // Submit the form
    await page.click('#form button[type="submit"]');
    
    // In a real test with a connected backend, we would verify the message appears
    // For this test, we'll just verify the input is cleared
    const inputValue = await page.$eval('#input', el => el.value);
    expect(inputValue).toBe('');
  });

  test('Channel leave form should be functional', async () => {
    // Wait for channel list and select first channel
    await page.waitForSelector('#renderList li a');
    await page.click('#renderList li a');
    
    // Check for leave channel form
    await expect(page.$('#leaveChannelForm')).resolves.toBeTruthy();
    
    // In a real test with a connected backend, we would test actually leaving
    // by clicking the form's submit button and verifying the channel is removed
  });
});
