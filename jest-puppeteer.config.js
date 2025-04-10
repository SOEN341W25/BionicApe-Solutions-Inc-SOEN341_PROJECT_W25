// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  server: {
    command: 'node app.js',
    port: 3000,
    launchTimeout: 10000,
    debug: true
  }
};
