const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');
const fs = require('fs');

module.exports = async function updateExistingSpec(specId, apiKey, filePath) {
  try {
    await updateExistingSpecWithRetry(
      specId,
      apiKey,
      filePath,
      () => {
        console.log('Retrying Update API spec...');
      },
      3,
    );
    console.log('[INFO] Updated API spec ', specId);
  } catch (err) {
    console.error(`[ERROR] Updating API spec ${specId} failed with error:`, err);
    throw err;
  }
};

async function updateExistingSpecWithRetry(specId, apiKey, filePath, onRetry, maxRetries) {
  async function retryWithBackoff(retries) {
    const specFile = fs.createReadStream(filePath);
    try {
      await waitFor(10000);
      await sdk.auth(apiKey);
      await sdk.updateAPISpecification(
        {
          spec: specFile,
        },
        {
          id: specId,
          accept: 'application/json',
        },
      );
      specFile.destroy();
      return;
    } catch (err) {
      specFile.destroy();
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
