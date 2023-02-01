const sdk = require('api')('@developers/v2.0#kpjtacsldjbscf9')
const API_KEYS = require("./API_KEYS");
const getSpecMetadata = require("./get-spec-metadata");
const updateExistingSpec = require("./update-existing-spec");
const createNewSpec = require("./create-new-spec");

require('dotenv').config();

module.exports = async function uploadAPISpecification(filePath) {

    const [version_number, file_name] = filePath.split("descriptions/")[1].split("/");

    await sdk.auth(API_KEYS["type"]);

    version_detail = await getSpecMetadata(
                        version_number,
                        API_KEYS["type"]
                        )
                    .then((res) => {
                        console.log("from uploadAPISpecification",res);
                        return res;
                    })
                    .catch((err) => {
                        console.log(err);
                    });

    var spec_key_id = null;
    version_detail?.forEach(element => {
        if(element.title == 'Intercom API' && element.source == 'api' && element.type == 'oas'){
            spec_key_id = element.id;
        }
    });

    if(spec_key_id){
        await sdk.auth(API_KEYS["type"]);
        await updateExistingSpec(
            spec_key_id,
            API_KEYS["type"],
            filePath
        )
        .then((res) => {
            return res;
        })
        .catch((err) => {
            console.log(err);
        });
    }
    else {
        await sdk.auth(API_KEYS["type"]);
        await createNewSpec(
            API_KEYS["type"],
            filePath
        )
        .then((res) => {
            return res;
        })
        .catch((err) => {
            console.log(err);
        });
    }
};
