const path = require('path');
module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: [path.resolve(__dirname, './backend/tests/jest.setup.js')],
  testMatch: ['**/backend/tests/acceptance/**/*.test.js'],
  testTimeout: 30000
};
