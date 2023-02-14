const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

require('dotenv').config();

module.exports = async function getSpecVersion(versionNumber, apiKey) {
  let specKeyId = null;
  try {
    await sdk.auth(apiKey);
    let apiSpecs = await sdk.getAPISpecification({
      perPage: '10',
      page: '1',
      'x-readme-version': versionNumber,
    });
    apiSpecs?.forEach((spec) => {
      if (spec.title === 'Intercom API' && spec.source === 'api' && spec.type === 'oas') {
        specKeyId = spec.id;
      }
    });
    return specKeyId;
  } catch (err) {
    console.error('[ERROR] Failed to fetch specMetadata for version', versionNumber);
    throw err;
  }
};
