const yaml = require('js-yaml');
const fs = require('fs');
const OUTPUT_FOLDER = './compiled';
const OpenAPI = require('./open-api');

module.exports = async function createCollectionFromYaml(filePath) {
  let versionNumber = filePath.split('/')[1];
  let fileName = `intercom-api-${versionNumber}.json`;
  try {
    let openApiYamlDoc = yaml.load(fs.readFileSync(filePath));
    let doc = JSON.stringify(openApiYamlDoc, null, 2);
    let openapi = new OpenAPI(doc);
    let collection = await openapi.convert();
    dumpCollectionToFolder(fileName, collection);
  } catch (err) {
    console.error(`[ERROR] Failed to convert ${collectionName} to collection. Error: ${err}`);
    throw err;
  }
};

async function dumpCollectionToFolder(fileName, collection) {
  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  }

  fs.writeFileSync(`${OUTPUT_FOLDER}/${fileName}`, JSON.stringify(collection, null, 2));
}
