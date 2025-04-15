const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const OpenAPI = require('./open-api');

module.exports = async function createCollectionFromYaml(filePath) {
  // Get version from the directory containing the YAML file
  const pathParts = filePath.split('/');
  const versionNumber = pathParts[pathParts.length - 2]; // Get second-to-last part before the yaml file

  // Use relative paths from the project root
  const versionFolder = `postman/${versionNumber}`;

  if (!fs.existsSync('postman')) {
    fs.mkdirSync('postman');
  }
  if (!fs.existsSync(versionFolder)) {
    fs.mkdirSync(versionFolder);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const openApiYamlDoc = YAML.parse(fileContents);
  const doc = JSON.stringify(openApiYamlDoc, null, 2);

  const openapi = new OpenAPI(doc);
  const collection = await openapi.convert();

  collection.info = {
    ...collection.info,
    version: versionNumber,
    updatedAt: new Date().toISOString(),
  };

  const outputPath = path.join(versionFolder, 'intercom-api.postman_collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

  // Create a version-specific environment file (optional)
  const environment = {
    id: `intercom-api-${versionNumber}-environment`,
    name: `Intercom API ${versionNumber} Environment`,
    values: [
      {
        key: 'baseUrl',
        value: 'https://api.intercom.io',
        type: 'default',
        enabled: true,
      },
      {
        key: 'token',
        value: 'YOUR_ACCESS_TOKEN',
        type: 'secret',
        enabled: true,
      },
    ],
  };

  fs.writeFileSync(
    path.join(versionFolder, 'environment.json'),
    JSON.stringify(environment, null, 2),
  );

  // Create a README for the version
  const readmeContent = `# Intercom API ${versionNumber} Postman Collection

This directory contains the Postman collection for Intercom API version ${versionNumber}.

## Files
- \`intercom-api.postman_collection.json\`: The main Postman collection
- \`environment.json\`: Environment variables for this version

## Usage
1. Import the collection into Postman
2. Import the environment file
3. Set your access token in the environment variables
4. Start making API calls!

Last updated: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(versionFolder, 'README.md'), readmeContent);

  return outputPath;
};
