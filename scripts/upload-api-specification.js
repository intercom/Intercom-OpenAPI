const API_KEYS = require('./API_KEYS');
const getSpecMetadata = require('./get-spec-metadata');
const updateExistingSpec = require('./update-existing-spec');
const createNewSpec = require('./create-new-spec');
const fs   = require('fs');
const path = require("path");

require('dotenv').config();

module.exports = async function uploadAPISpecification(filePath) {
  
  // Skip non-yaml files
  if (filePath.slice(-5) !== '.yaml') {
    console.log('[INFO] skipping upload');
    return;
  }
  
  const [version_number, file_name] = filePath.split('descriptions/')[1].split('/');
  let version_detail;
  
  //fetch existing specifications for the currect version if any.
  try {
    version_detail = await getSpecMetadata(version_number, API_KEYS["type"]);
  } catch (err) {
    throw new Error(err);
  }

  let spec_key_id = null;
  version_detail?.forEach((element) => {
    if (element.title == 'Intercom API' && element.source == 'api' && element.type == 'oas') {
      spec_key_id = element.id;
    }
  });

  //create a stream of the file to be uploaded.  
  const file = fs.createReadStream( path.join(
        filePath.split(file_name)[0],
        "api.intercom.io.yaml"
    ),);

  //If a version is found then update the same. If not, create a new version.

  if (spec_key_id) {
    try {
      return await updateExistingSpec(spec_key_id, API_KEYS["type"], file);
    } catch (err) {
      throw new Error(err);
    }
  } else {
    try {
      return await createNewSpec( API_KEYS["type"], file, version_number);
    } catch (err) {
      throw new Error(err);
    }
  }
};
