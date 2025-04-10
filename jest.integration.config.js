const path = require('path');
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.resolve(__dirname, './BACKEND_/tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/BACKEND_/tests/integration/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage-integration',
  verbose: true,
  testTimeout: 30000
};
