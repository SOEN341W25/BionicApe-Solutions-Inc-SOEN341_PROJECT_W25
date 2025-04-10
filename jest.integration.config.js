// jest.integration.config.js
const path = require('path');
module.exports = {
  testEnvironment: 'node', // Important: use node environment for mongoose
  setupFilesAfterEnv: [path.resolve(__dirname, './BACKEND_/tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/BACKEND_/tests/integration/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage-integration',
  verbose: true,
  testTimeout: 30000,
  // Add this to suppress mongoose warnings
  globals: {
    SUPPRESS_JEST_WARNINGS: true
  }
};
