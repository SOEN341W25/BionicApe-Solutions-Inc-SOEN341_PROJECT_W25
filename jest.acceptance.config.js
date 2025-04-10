// jest.acceptance.config.js
const path = require('path');

module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: [path.resolve('./tests/jest.setup.js')],
  testMatch: ['**/tests/acceptance/**/*.test.js'],
  testTimeout: 30000
};
