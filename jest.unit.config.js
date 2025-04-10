// jest.unit.config.js
const path = require('path');
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [path.resolve('./BACKEND_/tests/jest.setup.js')],
  moduleFileExtensions: ['js'],
  testMatch: ['**/BACKEND_/tests/unit/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage-unit',
  verbose: true
};
