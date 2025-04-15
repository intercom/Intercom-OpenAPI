const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const API_KEYS = require('../utils/API_KEYS');
const axios = require('axios');

module.exports = async function updatePostmanCollection(collection, collectionId) {
  try {
    console.log(`[INFO] Updating collection ${collection.info.name}`);
    await axios.put(
      `https://api.getpostman.com/collections/${collectionId}`,
      { collection },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `${API_KEYS.postman}`,
        },
      },
    );
  } catch (error) {
    console.error(
      `[ERROR] Error occurred while updating collection. ${collectionId} Error: ${error}`,
    );
    throw error;
  }
};
