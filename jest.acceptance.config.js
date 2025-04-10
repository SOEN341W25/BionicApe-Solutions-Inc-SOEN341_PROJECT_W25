const path = require('path');
module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: [path.resolve(__dirname, './BACKEND_/tests/jest.setup.js')],
  testMatch: ['**/BACKEND_/tests/acceptance/**/*.test.js'],
  testTimeout: 30000
};
