const path = require('path');
const uploadAPISpecification = require('./upload-api-specification');
const core = require('@actions/core');

(async () => {
  //fetch the changed files
  try {
    const files = process.argv.slice(2, -1);
    for (const file of files) {
      const filepath = path.join(__dirname, '..', file);
      await uploadAPISpecification(filepath);
    }
  } catch (err) {
    core.setFailed('Action Failed. See logs for error.');
  }
})();
