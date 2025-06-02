// Add this shim for the missing validator module
const fs = require('fs');
const path = require('path');

// Check if the file exists and create it if not
const nullCheckPath = path.join(__dirname, 'node_modules', 'validator', 'lib', 'util');
const nullCheckFile = path.join(nullCheckPath, 'nullUndefinedCheck.js');

if (!fs.existsSync(nullCheckPath)) {
  fs.mkdirSync(nullCheckPath, { recursive: true });
}

if (!fs.existsSync(nullCheckFile)) {
  fs.writeFileSync(nullCheckFile, `
    module.exports = function nullUndefinedCheck(value) {
      return value === null || value === undefined;
    };
  `);
}

// Now start the actual server
require('./index.js');