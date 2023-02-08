const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

module.exports = async function updateExistingSpec(spec_key_id, apiKey, spec_file) {
  try {
    await sdk.auth(apiKey);
    let updated_doc = await sdk.updateAPISpecification(
      {
        spec: spec_file,
      },
      {
        id: spec_key_id,
        accept: 'application/json',
      },
    );
    console.log('[INFO] Doc updated ', updated_doc);
    return updated_doc;
  } catch (err) {
    console.log(err);
    var message = await err.json();
    console.error("[ERROR] Tried to update existing spec", spec_key_id, " The error is ", message);
    throw new Error(message);
  }
};
