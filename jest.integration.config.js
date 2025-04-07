module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/integration/**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage-integration',
  verbose: true,
  testTimeout: 30000
};
