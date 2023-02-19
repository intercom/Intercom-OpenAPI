const path = require('path');
const generatePostmanCollection = require('./generate-postman-collection');
const converttocollection = require('./convert-to-collection');
const core = require('@actions/core');

const directoryPath = path.join(__dirname, '../descriptions/.');

(async () => {
  try {
    let deployCollection = false;
    const files = process.argv.slice(2, -1);
    for (const file of files) {
      if (file.slice(-5) == '.yaml') {
        deployCollection = true;
        break;
      }
    }
    if (deployCollection) {
      await converttocollection(directoryPath);
      generatePostmanCollection();
    } else {
      console.log('No yaml files changed. Skipping collection generation.');
    }
  } catch (err) {
    core.setFailed('Action Failed. See logs for error.');
    console.error(err);
  }
})();
