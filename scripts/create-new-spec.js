const getSpecVersion = require('./get-spec-version');
const updateExistingSpec = require('./update-existing-spec');
const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
const fs = require('fs');

module.exports = async function createNewSpec(apiKey, specFile, versionNumber, filePath) {
  try {
    await sdk.auth(apiKey);
    let created_doc = await sdk.uploadAPISpecification(
      {
        spec: specFile,
      },
      {
        accept: 'application/json',
        'x-readme-version': versionNumber,
      },
    );
    console.log('[INFO] Doc created ', created_doc);
    return created_doc;
  } catch (err) {
    console.error('[ERROR] Error creating new spec', err);
    if (err.status == 503) {
      console.log('[INFO] 503 error, trying again');
      try {
        return await updateExistingSpecWithRetry(
          versionNumber,
          apiKey,
          filePath,
          () => {
            console.log('Retrying Update API spec...');
          },
          2,
        );
      } catch (err) {
        throw err;
      }
    } else {
      var message = await err.json();
      console.error('[ERROR] Error creating new spec', message);
      throw err;
    }
  }
};

async function updateExistingSpecWithRetry(versionNumber, apiKey, filePath, onRetry, maxRetries) {
  async function retryWithBackoff(retries) {
    try {
      await waitFor(5000);
      specKeyId = await getSpecVersion(versionNumber, apiKey);
      const file = fs.createReadStream(filePath);
      return await updateExistingSpec(specKeyId, apiKey, file);
    } catch (err) {
      if (retries < maxRetries) {
        onRetry();
        return retryWithBackoff(retries + 1);
      } else {
        console.warn('[WARN] Max retries reached. Bubbling the error up');
        throw err;
      }
    }
  }
  return retryWithBackoff(0);
}

function waitFor(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
