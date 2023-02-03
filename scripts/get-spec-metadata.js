const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

require('dotenv').config();

module.exports = async function getSpecMetadata(version_number, apiKey) {
  try{
    await sdk.auth(apiKey);
    let api_spec = await sdk
      .getAPISpecification({
        perPage: '10',
        page: '1',
        'x-readme-version': version_number,
      });
      return api_spec;
  } catch (err) {
    var message = await err.json();
    console.error(" [ERROR] Tried to fetch specMetadata for version ${version_number} but failed.", message);
    throw new Error(message);
  }
};