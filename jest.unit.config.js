const path = require('path');
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [path.resolve(__dirname, './BACKEND_/tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/backend/tests/unit/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage-unit',
  verbose: true
};
