const getSpecVersion = require('./get-spec-version');
const updateExistingSpec = require('./update-existing-spec');
const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
const fs = require('fs');

module.exports = async function createNewSpec(apiKey, versionNumber, filePath) {
  const specFile = fs.createReadStream(filePath);
  try {
    await sdk.auth(apiKey);
    let createdSpec = await sdk.uploadAPISpecification(
      {
        spec: specFile,
      },
      {
        accept: 'application/json',
        'x-readme-version': versionNumber,
      },
    );
    specFile.destroy();
    console.log('[INFO] Created API spec', createdSpec.id);
    return createdSpec;
  } catch (err) {
    specFile.destroy();
    console.error('[ERROR] Error creating API spec', err);
    if (err.status == 503) {
      console.log('[INFO] 503 error, trying again');
      try {
        specId = await getSpecVersion(versionNumber, apiKey);
        console.log(`[INFO] Updating API spec ${specId} on version ${versionNumber}`);
        return await updateExistingSpec(specId, apiKey, filePath);
      } catch (err) {
        throw err;
      }
    } else {
      var message = await err.json();
      console.error('[ERROR] Error creating API spec', message);
      throw err;
    }
  }
};
