const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

module.exports = async function deleteSpec(specKeyId, apiKey) {
  try {
    await sdk.auth(apiKey);
    await sdk.deleteAPISpecification({ id: specKeyId });
    console.log(`[INFO] Deleted API spec id ${specKeyId}`);
    return;
  } catch (err) {
    console.error(`[ERROR] Deleting Api spec id ${specKeyId} failed with error:`, err);
    throw err;
  }
};
