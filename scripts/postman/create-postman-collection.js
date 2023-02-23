const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const API_KEYS = require('../utils/API_KEYS');
const axios = require('axios');

module.exports = async function createPostmanCollection(collection, collectionName) {
  try {
    console.log(`[INFO] Creating collection ${collectionName}`);
    await axios.post(
      `https://api.getpostman.com/collections?workspace=${API_KEYS.pmWorkspaceId}`,
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
      `[ERROR] Error occurred while creating collection: ${collectionName} Error: ${error}`,
    );
    throw error;
  }
};
