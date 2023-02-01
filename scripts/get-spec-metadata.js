const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9')

require('dotenv').config();

module.exports = async function getSpecMetadata(version_number, apiKey) {
  console.log(typeof version_number);
  await sdk.auth(apiKey);
  await sdk.getAPISpecification( {
      perPage: '10',
      page: '1',
      'x-readme-version': version_number 
    } )
  .then(({ data }) => {
      console.log("from getSpecMetadata",data);
      return data;
  } )
  .catch(async (err) => {
      throw new Error(err);
  });
};