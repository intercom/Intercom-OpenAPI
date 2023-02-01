const path = require('path');
const uploadAPISpecification = require('./upload-api-specification');

(async () => {
  const files = ['/descriptions/5.0/api.intercom.io.yaml'];
  for (const file of files) {
    const filepath = path.join(__dirname, '..', file);
    await uploadAPISpecification(filepath);
  }
})();
