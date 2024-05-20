const sharp = require('sharp');
const stream=require('stream');
const fs = require('fs');

let aspect_ratios={};

let sizes={
    sm:500,
    md:1000,
    lg:1500,
    xl:2500
}


let archive_root='assets/images_for_web/archive';
let pages_root='assets/images_for_web/pages';

let get_path={
    manuscript:(id,size,ext)=>`${archive_root}/manuscript${id}/scan@@${size}.${ext}`,
    standalone:(name,size,ext)=>`${pages_root}/img@@${name}@@${size}.${ext}`,
    artifact:(id,subid,size,name,ext)=>`${archive_root}/manuscript${id}/artifact${subid}/img@@${name}@@${size}.${ext}`
}


function get_path_pair(image,size){
    let jpg=image.type=='manuscript'?
                get_path.manuscript(image.metadata.manuscript_id,size,'jpg')
            :image.type=='artifact'?
                get_path.artifact(
                    image.metadata.manuscript_id,
                    image.metadata.artifact_subid,
                    size,
                    image.filename,
                    'jpg')
            :image.type=='standalone'?
                get_path.standalone(image.filename,size,'jpg')
            :'';

    let webp=image.type=='manuscript'?
                get_path.manuscript(image.metadata.manuscript_id,size,'webp')
            :image.type=='artifact'?
                get_path.artifact(
                    image.metadata.manuscript_id,
                    image.metadata.artifact_subid,
                    size,
                    image.filename,
                    'webp')
            :image.type=='standalone'?
                get_path.standalone(image.filename,size,'webp')
            :'';

    return {jpg,webp}
}


module.exports=async function process_images(image_processing_queue,cms){
    console.log(`   processing ${image_processing_queue.length} valid images...`)
    let new_counter=0;

    // create any new directory folders
    for(let manuscript of cms.manuscripts){
        create_folders(manuscript,cms)
    }

    for(let image of image_processing_queue){

        let size_missing=false;
         // check if any of the sizes don't exist
         
        for(let size of image.metadata?.sizes || []){
            image.filename = image.name.replace(/\.[^/.]+$/, '');

            let path=get_path_pair(image,size);
            let exists=fs.existsSync(path.jpg)&&fs.existsSync(path.webp);
            if(!exists) size_missing=true;
        }

        if(size_missing){
            console.log(`      downloading and resizing ${image.name}...`);
            new_counter++;
            await load_image(image);
            // if at least one does not exist, redowload and process the image
        }

        if(image.type=='standalone'){
            let rendition=get_path_pair(image,image.metadata?.sizes[0]);
            let aspect_ratio=await sharp(rendition.jpg).metadata().then((meta)=>{return meta?.height/meta?.width})
            aspect_ratios["img-"+image.name]=aspect_ratio;
        }


     
    }

    console.log(`   processed ${new_counter} new images.`);
    return {
        aspect_ratios
    }
    // return true;
}


function create_folders(manuscript,data){
    let dir=archive_root+'/manuscript'+manuscript.properties.manuscript_id.value;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    manuscript.dir=dir;
    let artifacts=data.artifacts.filter(a=>a.properties.manuscript_id.value==manuscript.properties.manuscript_id.value);
    for(let artifact of artifacts){
        let subdir=dir+'/artifact'+artifact.properties.artifact_subid.value;
        if (!fs.existsSync(subdir)){
            fs.mkdirSync(subdir, { recursive: true });
        }
    }
}


function load_image(image){

    return new Promise(async (resolve) => {

        let promises=[];
        const sharpStream = sharp({ failOn: 'none' });
        for(let size of image.metadata.sizes){
            let path=get_path_pair(image,size);
            promises.push(
                sharpStream
                    .clone()
                    .resize({width:sizes[size]})
                    .toFormat('jpg')
                    .toFile(path.jpg)
            );

            promises.push(
                sharpStream
                    .clone()
                    .resize({width:sizes[size]})
                    .toFormat('webp')
                    .toFile(path.webp)
            );
        }

        const {body}=await fetch(image.url);
        let readableStream=stream.Readable.fromWeb(body)
        readableStream.pipe(sharpStream);

        Promise.all(promises)
        .then(res => { resolve(true) })
        
    })
}

