const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
require('dotenv').config();

module.exports = async function updateExistingSpec(spec_key_id, apiKey, spec_file_name) {
  await sdk.auth(apiKey);
  return await sdk
    .updateAPISpecification(
      {
        spec: spec_file_name,
      },
      {
        id: spec_key_id,
        accept: 'application/json',
      },
    )
    .then(({ data }) => {
      return data;
    })
    .catch(async (err) => {
      throw new Error(await err.json());
    });
};
