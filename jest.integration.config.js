const path = require('path');
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.resolve(__dirname, './backend/tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/backend/tests/integration/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage-integration',
  verbose: true,
  testTimeout: 30000
};
