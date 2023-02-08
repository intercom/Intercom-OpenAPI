const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

module.exports = async function deleteSpec(apiKey, spec_file,spec_key_id) {
  try{
    await sdk.auth(apiKey);
    console.log('[INFO] inside createNewSpec function with version number ',version_number,' and file ',spec_file);
    let deleted_doc =  await sdk
    .deleteAPISpecification(
        {id: spec_key_id}
    );
    console.log("[INFO] Doc deleted ",deleted_doc);
    return deleted_doc;
  } catch (err) {
    var message = await err.json();
    console.error("[ERROR] Tried to update existing spec", spec_key_id, " The error is ", message);
    throw new Error(message);
  }
};
