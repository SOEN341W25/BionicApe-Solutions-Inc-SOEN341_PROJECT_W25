// BACKEND_/tests/jest.setup.js

// Polyfill for TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create a minimal DOM environment for testing
const { JSDOM } = require('jsdom');

const html = `
<!doctype html>
<html>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const dom = new JSDOM(html);
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
