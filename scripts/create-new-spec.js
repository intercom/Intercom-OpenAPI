const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

require('dotenv').config();

module.exports = async function createNewSpec(apiKey, spec_file,version_number) {
  try{
    await sdk.auth(apiKey);
    let created_doc =  await sdk
    .uploadAPISpecification(
      {
        spec: spec_file,
      },
      {
        accept: 'application/json',
        'x-readme-version': version_number
      },
    );
    console.log("[INFO] Doc created ",created_doc);
    return created_doc;
  }
  catch (err) {
    throw new Error(err);
  }
};
