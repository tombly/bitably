
var fs = require('fs');

function readConfig() {
  var config = JSON.parse(fs.readFileSync('Fetch/config.json', 'utf8'));
  return config;
}

module.exports = readConfig();
