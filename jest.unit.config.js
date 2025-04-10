const path = require('path');
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [path.resolve(__dirname, './tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/unit/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage-unit',
  verbose: true
};
