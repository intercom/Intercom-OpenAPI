const getSpecVersion = require('./get-spec-version');
const updateExistingSpec = require('./update-existing-spec');
const createNewSpec = require('./create-new-spec');
const fs = require('fs');
const deleteSpec = require('./delete-spec');

module.exports = async function uploadAPISpecification(filePath) {
  // Skip non-yaml files
  if (filePath.slice(-5) !== '.yaml') {
    console.log('[INFO] skipping non-yaml file', filePath);
    return;
  }

  //get the api key from the arguments passed to the script.
  let apiKey = process.argv.slice(-1)[0];
  let versionNumber = null;
  let deleteFile = false;
  let specKeyId = null;

  try {
    if (!fs.readFileSync(filePath)) {
      deleteFile = true;
    }
    [versionNumber] = filePath.split('descriptions/')[1].split('/');
    if (versionNumber == 'Unstable') {
      // If the version is unstable, set it to 0
      versionNumber = '0';
    }
  } catch (err) {
    console.error('[ERROR] ', err);
    throw err;
  }

  //fetch existing specifications for the currect version if any.
  try {
    specKeyId = await getSpecVersion(versionNumber, apiKey);
  } catch (err) {
    console.error("[ERROR] Couldn't fetch specification version");
  }

  if (deleteFile && specKeyId) {
    try {
      console.log(`[INFO] trying to delete API spec ${specKeyId} on version ${versionNumber}`);
      return await deleteSpec(specKeyId, apiKey);
    } catch (err) {
      throw err;
    }
  }

  if (deleteFile && !specKeyId) {
    console.log('[INFO] no file to delete');
    return;
  }

  try {
    //If a version is found then update the same. If not, create a new version.
    if (specKeyId) {
      try {
        console.log(`[INFO] Updating API spec ${specKeyId} on version ${versionNumber}`);
        return await updateExistingSpec(specKeyId, apiKey, filePath);
      } catch (err) {
        throw err;
      }
    } else {
      try {
        console.log(`[INFO] Creating API spec on version ${versionNumber}`);
        return await createNewSpec(apiKey, versionNumber, filePath);
      } catch (err) {
        throw err;
      }
    }
  } catch (err) {
    console.error('[ERROR] Error occurred during API spec Create/Update ', err);
    throw err;
  }
};
