module.exports = {
  launch: {
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  },
  server: {
    command: 'NODE_ENV=test node app.js',
    port: 3000,
    launchTimeout: 30000,
    debug: true
  },
  browserContext: 'default'
};
