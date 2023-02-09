const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

require('dotenv').config();

module.exports = async function getSpecVersion(version_number, apiKey) {
  try {
    await sdk.auth(apiKey);
    let api_spec = await sdk.getAPISpecification({
      perPage: '10',
      page: '1',
      'x-readme-version': version_number,
    });
    let spec_key_id = null;
    api_spec?.forEach((element) => {
      if (element.title == 'Intercom API' && element.source == 'api' && element.type == 'oas') {
        spec_key_id = element.id;
      }
    });
    return spec_key_id;
  } catch (err) {
    var message = await err.json();
    console.error(
      '[ERROR] Tried to fetch specMetadata for version',
      version_number,
      ' but failed.',
      message,
    );
    throw new Error(message);
  }
};
