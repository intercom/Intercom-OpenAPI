const sdk = require('api')('@developers/v2.0#1yl2ql5lb604m');
const API_KEYS = require('./API_KEYS');
const getSpecMetadata = require('./get-spec-metadata');
const updateExistingSpec = require('./update-existing-spec');
const createNewSpec = require('./create-new-spec');

require('dotenv').config();

module.exports = async function uploadAPISpecification(filePath) {
  const [version_number, file_name] = filePath.split('descriptions/')[1].split('/');
  var version_detail;

  try {
    version_detail = await getSpecMetadata(version_number, API_KEYS['type']);
  } catch (err) {
    console.error(
      `[ERROR] Tried to fetch specMetadata for version ${version_number} but failed. ${err}`,
    );
  }

  var spec_key_id = null;
  version_detail?.forEach((element) => {
    if (element.title == 'Intercom API' && element.source == 'api' && element.type == 'oas') {
      spec_key_id = element.id;
    }
  });

  await sdk.auth(API_KEYS['type']);

  if (spec_key_id) {
    try {
      return await updateExistingSpec(spec_key_id, API_KEYS['type'], filePath);
    } catch (err) {
      console.error(`[ERROR] Tried to update existing spec (${spec_key_id}). ${err}`);
    }
  } else {
    try {
      return await createNewSpec(API_KEYS['type'], filePath);
    } catch (err) {
      console.error(`[ERROR] Error creating new spec. ${err}`);
    }
  }
};
