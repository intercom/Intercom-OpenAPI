const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
const fs = require('fs');

module.exports = async function updateExistingSpec(spec_key_id, apiKey, filePath) {
  try {
    const file = fs.createReadStream(filePath);
    await sdk.auth(apiKey);
    let updated_doc = await sdk.updateAPISpecification(
      {
        spec: file,
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
    if (err.status == 503) {
      console.log('[INFO] 503 error, trying again');
      return await updateExistingSpec(spec_key_id, apiKey, filePath);
    }
    var message = await err.json();
    console.error('[ERROR] Tried to update existing spec', spec_key_id, ' The error is ', message);
    throw new Error(message);
  }
};
