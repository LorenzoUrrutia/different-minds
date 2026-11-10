// Every page on the site. Add new pages here so they get tested.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
module.exports = fs
  .readdirSync(root)
  .filter((f) => f.endsWith('.html'))
  .sort();
