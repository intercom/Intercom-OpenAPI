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

  //get the api key from the arguments passed to the script.
  let key = process.argv.slice(-1)[0];

  // Load the file
  try{
  const doc = yaml.load(fs.readFileSync(filePath));
  let version_number = doc.info.version;
  
  console.log('[INFO] loading file ', filePath);
  
  // If the version is unstable, set it to 0
  if(version_number == 'Unstable'){
    version_number = '0';
  }

  console.log('[INFO] fetch existing specifications for the currect version if any.');
  
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

  console.log('[INFO] fetch existing specifications for the currect version if any.,' ,version_detail);
  //create a stream of the file to be uploaded.
  const file = fs.createReadStream(filePath);

  //If a version is found then update the same. If not, create a new version.

  if (spec_key_id) {
    try {
      console.log('[INFO] trying to upload file. for', spec_key_id);
      return await updateExistingSpec(spec_key_id, key, file);
    } catch (err) {
      throw new Error(err);
    }
  } else {
    try {
      console.log('[INFO] trying to create new file');
      return await createNewSpec(key, file, version_number);
    } catch (err) {
      throw new Error(err);
    }
  }
  } catch (e) {
    console.log('[INFO] trying to delete the openapi spec', e);
    const [version, file] = filePath.split('descriptions/')[1].split('/');
    console.log('[INFO] fetch existing specifications for the currect version if any.');
  
    //fetch existing specifications for the currect version if any.
    try {
      version_detail = await getSpecMetadata(version, key);
    } catch (err) {
      throw new Error(err);
    }
    let spec_key_id = null;
    version_detail?.forEach((element) => {
      if (element.title == 'Intercom API' && element.source == 'api' && element.type == 'oas') {
        spec_key_id = element.id;
      }
    });
    
  }


  
};
