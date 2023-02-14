const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9');

module.exports = async function updateExistingSpec(specId, apiKey, specFile) {
  try {
    await updateExistingSpecWithRetry(
      specId,
      apiKey,
      specFile,
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

async function updateExistingSpecWithRetry(specId, apiKey, specFile, onRetry, maxRetries) {
  async function retryWithBackoff(retries) {
    try {
      await waitFor(5000);
      await sdk.auth(apiKey);
      return await sdk.updateAPISpecification(
        {
          spec: specFile,
        },
        {
          id: specId,
          accept: 'application/json',
        },
      );
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
