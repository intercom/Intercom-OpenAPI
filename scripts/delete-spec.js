const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

module.exports = async function deleteSpec(spec_key_id, apiKey) {
  try {
    await sdk.auth(apiKey);
    let deleted_doc = await sdk.deleteAPISpecification({ id: spec_key_id });
    console.log('[INFO] Doc deleted ', deleted_doc);
    return deleted_doc;
  } catch (err) {
    console.log(err);
    var message = await err.json();
    console.error('[ERROR] Tried to delete existing spec', spec_key_id, ' The error is ', message);
    throw new Error(message);
  }
};
