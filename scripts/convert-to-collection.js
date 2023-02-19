require('dotenv').config();

const OpenAPI = require('./open-api');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const Collection = require('./collection');

const OUTPUT_FOLDER = './compiled';

module.exports = async function convertToCollection(filepath) {
  const descriptionFolder = fs.readdirSync(filepath, { withFileTypes: true });
  let collection_items = [];
  let doc = {};

  for (const specificVersionFolder of descriptionFolder) {
    console.log('generating collection for version: ', specificVersionFolder.name);
    let obj = yaml.load(
      fs.readFileSync(path.join(filepath, specificVersionFolder.name, '/api.intercom.io.yaml')),
    );
    doc = JSON.stringify(obj, null, 2);

    let openapi = new OpenAPI(doc);
    let collection = await openapi.convert();

    if (specificVersionFolder.name == '0') specificVersionFolder.name = 'Unstable';

    let version_folder = {
      name: 'Intercom API Version: ' + specificVersionFolder.name,
      item: [],
    };
    collection.forEach((c) => {
      version_folder.item.push(c);
    });
    collection_items.push(version_folder);
  }
  let objCollection = new Collection(JSON.parse(doc), collection_items);
  let collection = await objCollection.createCompleteCollection();

  dumpCollectionToFolder(`collection.json`, collection);
};

async function dumpCollectionToFolder(filename, collection) {
  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER);
  }

  fs.writeFileSync(`${OUTPUT_FOLDER}/${filename}`, JSON.stringify(collection, null, 2));
}
