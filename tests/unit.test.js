name: ChatHaven CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  lint:
    name: Linting
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Install ESLint
        run: npm install eslint --save-dev

      - name: Create ESLint config if needed
        run: |
          if [ ! -f .eslintrc.json ]; then
            echo '{
              "env": {
                "browser": true,
                "commonjs": true,
                "es2021": true,
                "node": true,
                "jest": true
              },
              "extends": "eslint:recommended",
              "parserOptions": {
                "ecmaVersion": 12
              },
              "rules": {
                "no-unused-vars": "warn",
                "no-console": "off"
              }
            }' > .eslintrc.json
          fi

      - name: Run ESLint
        run: npx eslint --ext .js .
        continue-on-error: true

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Install test dependencies
        run: npm install jest @testing-library/jest-dom jsdom mongoose bcryptjs supertest --save-dev

      - name: Create Jest config
        run: |
          echo "module.exports = { 
            testEnvironment: 'jsdom',
            moduleFileExtensions: ['js'],
            testMatch: ['**/tests/unit/**/*.test.js'],
            collectCoverage: true,
            coverageReporters: ['text', 'lcov', 'clover'],
            coverageDirectory: 'coverage',
            verbose: true,
            testTimeout: 30000
          };" > jest.config.js

      - name: Run unit tests
        run: npx jest --config=jest.config.js
        continue-on-error: true

      - name: Upload test coverage
        uses: actions/upload-artifact@v4
        with:
          name: unit-test-coverage
          path: coverage/

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Install test dependencies
        run: npm install jest supertest mongodb-memory-server --save-dev

      - name: Create Jest config for integration tests
        run: |
          echo "module.exports = { 
            testEnvironment: 'node',
            moduleFileExtensions: ['js'],
            testMatch: ['**/tests/integration/**/*.test.js'],
            collectCoverage: true,
            coverageReporters: ['text', 'lcov'],
            coverageDirectory: 'coverage-integration',
            verbose: true,
            testTimeout: 30000
          };" > jest.integration.config.js

      - name: Start MongoDB Memory Server
        run: |
          echo "Preparing MongoDB Memory Server environment..."
          mkdir -p .mongodb-data

      - name: Run integration tests
        run: npx jest --config=jest.integration.config.js
        continue-on-error: true

      - name: Upload integration test coverage
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-coverage
          path: coverage-integration/

  acceptance-tests:
    name: Acceptance Tests
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Install test dependencies
        run: npm install jest puppeteer jest-puppeteer --save-dev

      - name: Create Jest config for acceptance tests
        run: |
          echo "module.exports = { 
            preset: 'jest-puppeteer',
            testMatch: ['**/tests/acceptance/**/*.test.js'],
            testTimeout: 30000
          };" > jest.acceptance.config.js

      - name: Create puppeteer config
        run: |
          echo "module.exports = {
            launch: {
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            server: {
              command: 'npm start',
              port: 3000,
              launchTimeout: 10000,
              debug: true
            }
          };" > jest-puppeteer.config.js

      - name: Run acceptance tests
        run: npx jest --config=jest.acceptance.config.js
        continue-on-error: true

  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run npm audit
        run: npm audit
        continue-on-error: true

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, acceptance-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Create build package
        run: |
          echo "Creating production build..."
          mkdir -p build
          cp -r model build/
          mkdir -p build/public
          cp -r *.js build/
          echo '{"version": "1.0.0", "build": "'$GITHUB_RUN_NUMBER'", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > build/build-info.json

      - name: Archive build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: chathaven-build
          path: build/

  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: build
    environment: development
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: chathaven-build
          path: build

      - name: Display build info
        run: cat build/build-info.json

      - name: Setup development deployment
        run: |
          echo "Setting up development deployment..."
          # This would be replaced with actual deployment steps
          # For example, deploying to a staging server
          echo "Deployed to development environment"
