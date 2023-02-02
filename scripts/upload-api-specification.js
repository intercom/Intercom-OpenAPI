const API_KEYS = require('./API_KEYS');
const getSpecMetadata = require('./get-spec-metadata');
const updateExistingSpec = require('./update-existing-spec');
const createNewSpec = require('./create-new-spec');
const fs   = require('fs');
const path = require("path");

require('dotenv').config();

module.exports = async function uploadAPISpecification(filePath) {
  
  // Skip non-markdown files
  if (filePath.slice(-5) !== '.yaml') {
    console.log('[INFO] skipping upload');
    return;
  }
  const [version_number, file_name] = filePath.split('descriptions/')[1].split('/');
  let version_detail;

  try {
    //fetch existing specifications for the spec
    version_detail = await getSpecMetadata(version_number, API_KEYS["type"]);
  } catch (err) {
    console.error(
      `[ERROR] Tried to fetch specMetadata for version ${version_number} but failed. ${err}`,
    );
  }

  let spec_key_id = null;
  version_detail?.forEach((element) => {
    if (element.title == 'Intercom API' && element.source == 'api' && element.type == 'oas') {
      spec_key_id = element.id;
    }
  });

  //create a stream of the swagger file.
  const file = fs.createReadStream( path.join(
        filePath.split(file_name)[0],
        "api.intercom.io.yaml"
    ),);

  //If a doc is existing then update the existing version.
  //If not, create a new document.
  if (spec_key_id) {
    try {
      return await updateExistingSpec(spec_key_id, API_KEYS["type"], file);
    } catch (err) {
      console.error(`[ERROR] Tried to update existing spec (${spec_key_id}). ${err}`);
    }
  } else{
    try {
      return await createNewSpec( API_KEYS["type"], file, version_number);
    } catch (err) {
      console.error(`[ERROR] Error creating new spec. ${err}`);
    }
  }
};
