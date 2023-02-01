const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9')

require('dotenv').config();

module.exports = async function createNewSpec(apiKey, spec_file_name) {
  await sdk.auth(apiKey);
  return await sdk
    .uploadAPISpecification( 
      {
        spec: spec_file_name
      },
      {
        accept: 'application/json'
      }
    )
    .then(({ data }) => {
      return data;
    })
    .catch(async (err) => {
      throw new Error(await err.json());
    });
};