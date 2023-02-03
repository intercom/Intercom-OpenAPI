const path = require('path');
const uploadAPISpecification = require('./upload-api-specification');
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  //fetch the changed files
  try{
    const files = process.argv.slice(2,-1);
    for (const file of files) {
      const filepath = path.join(__dirname, '..', file);
      await uploadAPISpecification(filepath);
    }
  }
  catch(err){
    core.setFailed(err.message);
  }

})();
