const path = require('path');
const uploadAPISpecification = require('./upload-api-specification');

(async () => {
  //fetch the changed files
  const files = process.argv.slice(2);
  for (const file of files) {
    const filepath = path.join(__dirname, '..', file);
    await uploadAPISpecification(filepath);
  }
})();
