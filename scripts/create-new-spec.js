const getSpecVersion = require('./get-spec-version');
const updateExistingSpec = require('./update-existing-spec');
const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
const fs = require('fs');

module.exports = async function createNewSpec(apiKey, spec_file, version_number, filePath) {
  try {
    await sdk.auth(apiKey);
    console.log('[INFO] inside createNewSpec function with version number ', version_number);
    let created_doc = await sdk.uploadAPISpecification(
      {
        spec: spec_file,
      },
      {
        accept: 'application/json',
        'x-readme-version': version_number,
      },
    );
    console.log('[INFO] Doc created ', created_doc);
    return created_doc;
  } catch (err) {
    if (err.status == 503) {
      console.log('[INFO] 503 error, trying again');
      let spec_key_id = null;
      try {
        spec_key_id = await getSpecVersion(version_number, apiKey);
        if (spec_key_id) {
          return await updateExistingSpec(spec_key_id, apiKey, filePath);
        }
      } catch (err) {
        var message = await err.json();
        console.error(
          '[ERROR] Error while trying to update existing spec id on rety with 503 with specid ',
          spec_key_id,
          ' message',
          message,
        );
        throw new Error(err);
      }
    } else {
      var message = await err.json();
      console.error('[ERROR] Error creating new spec', message);
      throw new Error(err);
    }
  }
};
