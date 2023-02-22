const converter = require('openapi-to-postmanv2');
const fs = require('fs');
const OUTPUT_FOLDER = './compiled';

module.exports = async function createCollectionFromYaml(filePath) {
  let versionNumber = filePath.split('/')[1];
  let fileName = `intercom-api-${versionNumber}.json`;
  let collectionName = `Intercom API - v${versionNumber}`;
  if (versionNumber === '0') {
    collectionName = `Intercom API - Unstable`;
    fileName = `intercom-api-unstable.json`;
  }

  // configuration options for the conversion
  //https://github.com/postmanlabs/openapi-to-postman/blob/b2669837a9ee8c855b161ac3154905253d14c3d2/OPTIONS.md
  let options = {
    collapseFolders: false,
    detailedBlobValidation: true,
    exampleParametersResolution: 'Example',
    folderStrategy: 'Tags',
    indentCharacter: 'Space',
    optimizeConversion: true,
    requestNameSource: 'fallback',
    requestParametersResolution: 'Example',
    schemaFaker: false,
    suggestAvailableFixes: true,
    validateMetadata: true,
  };

  let openapiData = fs.readFileSync(filePath, { encoding: 'UTF8' });
  try {
    console.log(`[INFO] Converting Yaml file ${collectionName} into a collection.`);
    converter.convert({ type: 'string', data: openapiData }, options, (err, conversionResult) => {
      if (!conversionResult.result) {
        console.error(
          '[ERROR] Could not convert OpenAPI Yaml to collection. Reason :',
          conversionResult.reason,
        );
        throw err;
      } else {
        console.log(`[INFO] Successfully converted ${collectionName} to collection.`);
        conversionResult.output[0].data.info.name = collectionName;
        result = conversionResult.output[0].data;
        dumpCollectionToFolder(fileName, result);
      }
      return result;
    });
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
