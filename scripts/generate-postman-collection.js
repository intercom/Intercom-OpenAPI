require('dotenv').config();

const fs = require('fs');
const axios = require('axios');

const OUTPUT_FOLDER = './compiled';

module.exports = async function generatePostmanCollection() {
  const collectionId = process.argv.slice(-2)[0];
  collection = JSON.parse(fs.readFileSync(`${OUTPUT_FOLDER}/collection.json`).toString());
  const emptyCollection = { ...collection };
  emptyCollection.item = [];

  await axios
    .put(
      `https://api.getpostman.com/collections/${collectionId}`,
      { collection: emptyCollection },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.argv.slice(-1)[0],
        },
      },
    )
    .then(function () {
      console.log('EMPTY COLLECTION PUT OK');
      axios
        .put(
          `https://api.getpostman.com/collections/${collectionId}`,
          { collection },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': process.argv.slice(-1)[0],
            },
          },
        )
        .then(function () {
          console.log('FULL COLLECTION PUT OK');
        })
        .catch(function (error) {
          logAxiosError(error);
        });
    })
    .catch(function (error) {
      logAxiosError(error);
    });
};
function logAxiosError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.log('ERROR DATA', error.response.data);
    console.log('ERROR STATUS', error.response.status);
    console.log('ERROR HEADERS', error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    console.log('ERROR REQUEST', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('ERROR MESSAGE', error.response.status);
  }
  console.log('ERROR CONFIG', error.config);
  process.exit(1);
}
