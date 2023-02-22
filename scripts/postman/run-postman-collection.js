const uploadCollectionsToPostman = require('./upload-collections-to-postman');
const createCollectionFromYaml = require('./create-collection-from-yaml');
const core = require('@actions/core');
const fs = require('fs');
const OUTPUT_FOLDER = './compiled';

(async () => {
  try {
    let deployCollection = false;
    const files = process.argv.slice(2);
    for (const file of files) {
      if (file.slice(-5) == '.yaml') {
        await createCollectionFromYaml(file);
        deployCollection = true;
      }
    }
    if (deployCollection && fs.existsSync(OUTPUT_FOLDER)) {
      await uploadCollectionsToPostman();
    } else {
      console.log('No yaml files changed. Skipping collection generation.');
    }
  } catch (err) {
    core.setFailed('Action Failed. See logs for error.');
    console.error(err);
  }
})();
