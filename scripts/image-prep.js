const get_data=require('./notion.js');
const { AssetCache } = require("@11ty/eleventy-fetch");
const sharp = require('sharp');
const fs = require('fs');

async function get_cms_data(){
    let cached = new AssetCache("cms_data");
    if (cached.isCacheValid("10m")) {
		// return cached data.
		return cached.getCachedValue(); // a promise
	}

    let data=await get_data();
    await cached.save(data, "json");

	return data;
    
}


function create_folders(root,data){
    for(let manuscript of data.manuscripts){
        let dir=root+'manuscript'+manuscript.properties.manuscript_id.value;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        let artifacts=data.artifacts.filter(a=>a.properties.manuscript_id.value==manuscript.properties.manuscript_id.value);
        for(let artifact of artifacts){
            let subdir=dir+'/artifact'+artifact.properties.artifact_subid.value;
            if (!fs.existsSync(subdir)){
                fs.mkdirSync(subdir, { recursive: true });
            }
        }
    }
}


async function init(){
    let cms=await get_cms_data();
    // console.log(cms.manuscripts);
    create_folders('assets/images_raw/',cms)
    
    // console.log(cms.artifacts);
}

init();