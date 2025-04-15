const createCollectionFromYaml = require('./create-collection-from-yaml');
const fs = require('fs');
const path = require('path');

const processAllVersions = async () => {
  try {
    const descriptionsPath = path.join(process.cwd(), 'descriptions');

    // Get only numeric version directories
    const versionDirs = fs
      .readdirSync(descriptionsPath)
      .filter((item) => {
        const fullPath = path.join(descriptionsPath, item);
        return fs.statSync(fullPath).isDirectory() && !isNaN(parseFloat(item));
      })
      .sort((a, b) => parseFloat(a) - parseFloat(b));

    console.log(`Processing versions: ${versionDirs.join(', ')}`);

    for (const version of versionDirs) {
      const yamlPath = path.join(descriptionsPath, version, 'api.intercom.io.yaml');
      if (fs.existsSync(yamlPath)) {
        try {
          await createCollectionFromYaml(yamlPath);
          console.log(`✓ Processed version ${version}`);
        } catch (err) {
          console.error(`Error processing version ${version}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Failed to process versions:', err);
    process.exit(1);
  }
};

processAllVersions();
