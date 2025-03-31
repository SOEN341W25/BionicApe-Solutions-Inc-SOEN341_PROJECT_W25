// tests/acceptance/emoji-box.test.js
describe('Emoji Box Acceptance Tests', () => {
  beforeAll(async () => {
    // Set longer timeout for UI tests
    jest.setTimeout(30000);
  });

  beforeEach(async () => {
    // Navigate to the page with emoji functionality
    await page.goto('http://localhost:3000/emoji.html');
  });

  test('Emoji button should display emoji box when clicked', async () => {
    // Check emoji button exists
    await expect(page.$('#emoji-button')).resolves.toBeTruthy();
    
    // Check emoji box exists (initially hidden)
    await expect(page.$('#emoji-box')).resolves.toBeTruthy();
    
    // Get initial display state
    const initialDisplayState = await page.$eval('#emoji-box', el => window.getComputedStyle(el).display);
    expect(initialDisplayState).toBe('none');
    
    // Click emoji button
    await page.click('#emoji-button');
    
    // Verify emoji box is now displayed
    const newDisplayState = await page.$eval('#emoji-box', el => window.getComputedStyle(el).display);
    expect(newDisplayState).toBe('block');
  });

  test('Clicking an emoji should add it to input', async () => {
    // Make emoji box visible
    await page.click('#emoji-button');
    
    // Wait for emoji box to be visible
    await page.waitForSelector('#emoji-box[style*="display: block"]');
    
    // Check emoji input exists
    await expect(page.$('#emoji-input')).resolves.toBeTruthy();
    
    // Initial input should be empty
    const initialInputValue = await page.$eval('#emoji-input', el => el.value);
    expect(initialInputValue).toBe('');
    
    // Click an emoji (assuming there's at least one emoji with class 'emoji')
    const emojiExists = await page.$('.emoji');
    if (emojiExists) {
      // Get emoji data
      const emojiValue = await page.$eval('.emoji', el => el.getAttribute('data-emoji'));
      
      // Click the emoji
      await page.click('.emoji');
      
      // Verify emoji was added to input
      const newInputValue = await page.$eval('#emoji-input', el => el.value);
      expect(newInputValue).toBe(emojiValue);
      
      // Verify emoji box is closed after selection
      const boxDisplayState = await page.$eval('#emoji-box', el => window.getComputedStyle(el).display);
      expect(boxDisplayState).toBe('none');
    }
  });

  test('Emoji box should toggle visibility on button clicks', async () => {
    // Click emoji button to show box
    await page.click('#emoji-button');
    let displayState = await page.$eval('#emoji-box', el => window.getComputedStyle(el).display);
    expect(displayState).toBe('block');
    
    // Click emoji button again to hide box
    await page.click('#emoji-button');
    displayState = await page.$eval('#emoji-box', el => window.getComputedStyle(el).display);
    expect(displayState).toBe('none');
    
    // Click one more time to show again
    await page.click('#emoji-button');
    displayState = await page.$eval('#emoji-box', el => window.getComputedStyle(el).display);
    expect(displayState).toBe('block');
  });
});
