// jest.integration.config.js
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.resolve('./tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/integration/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage-integration',
  verbose: true,
  testTimeout: 30000
};
