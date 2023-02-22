const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const API_KEYS = require('../utils/API_KEYS');
const OUTPUT_FOLDER = './compiled';
const createPostmanCollection = require('./create-postman-collection');
const updatePostmanCollection = require('./update-postman-collection');

module.exports = async function uploadCollectionsToPostman() {
  try {
    const files = fs.readdirSync(OUTPUT_FOLDER);
    for (const file of files) {
      let collection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/${file}`).toString());
      let collectionName = collection.info.name;
      let collectionId = await getCollectionId(collectionName);
      if (collectionId) {
        await updatePostmanCollection(collection, collectionId);
      } else {
        await createPostmanCollection(collection, collectionName);
      }
    }
  } catch (err) {
    console.error(`[ERROR] Failed to upload collection to Postman. Error: ${err}`);
    throw err;
  }
};

async function getCollectionId(collectionName) {
  console.log(`[INFO] Checking if collection ${collectionName} exists`);
  try {
    const response = await axios.get(
      `https://api.getpostman.com/collections?apikey=${API_KEYS.postman}`,
    );
    const collections = response.data.collections;
    for (const collection of collections) {
      if (collection.name === collectionName) {
        return collection.id;
      }
    }
    return;
  } catch (err) {
    console.error(`[ERROR] Error occurred while getting collection id. Error: ${err}`);
    throw err;
  }
}
