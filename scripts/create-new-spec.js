const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
const getSpecVersion = require('./get-spec-version');
const updateExistingSpec = require('./update-existing-spec');

module.exports = async function createNewSpec(apiKey, spec_file, version_number) {
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
    console.log(err);
    if (err.status === 503) {
      console.log('[INFO] 503 error, retrying with update version...');
      spec_key_id = await getSpecVersion(version_number, key);
      return await updateExistingSpec(spec_key_id, apiKey, spec_file);
    }
    var message = await err.json();
    console.error('[ERROR] Error creating new spec', message);
    throw new Error(message);
  }
};
