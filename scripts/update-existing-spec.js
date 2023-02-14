const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

module.exports = async function updateExistingSpec(specId, apiKey, specFile) {
  try {
    await sdk.auth(apiKey);
    await sdk.updateAPISpecification(
      {
        spec: specFile,
      },
      {
        id: specId,
        accept: 'application/json',
      },
    );
    console.log(`[INFO] Updated API spec ${specId}`);
    return;
  } catch (err) {
    console.error(`[ERROR] Updating API spec ${specId} failed with error:`, err);
    throw err;
  }
};
