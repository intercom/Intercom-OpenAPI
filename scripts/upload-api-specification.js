const getSpecMetadata = require('./get-spec-metadata');
const updateExistingSpec = require('./update-existing-spec');
const createNewSpec = require('./create-new-spec');
const fs = require('fs');
const yaml = require('js-yaml');

module.exports = async function uploadAPISpecification(filePath) {
  // Skip non-yaml files
  if (filePath.slice(-5) !== '.yaml') {
    console.log('[INFO] skipping upload');
    return;
  }

  // Load the file
  const doc = yaml.load(fs.readFileSync(filePath));
  let version_number = doc.info.version;

  // If the version is unstable, set it to 0
  if(version_number == 'Unstable'){
    version_number = '0';
  }

  //get the api key from the arguments passed to the script.
  let key = process.argv.slice(-1)[0];

  //fetch existing specifications for the currect version if any.
  try {
    version_detail = await getSpecMetadata(version_number, key);
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
  const file = fs.createReadStream(filePath);

  //If a version is found then update the same. If not, create a new version.

  if (spec_key_id) {
    try {
      return await updateExistingSpec(spec_key_id, key, file);
    } catch (err) {
      throw new Error(err);
    }
  } else {
    try {
      return await createNewSpec(key, file, version_number);
    } catch (err) {
      throw new Error(err);
    }
  }
};
