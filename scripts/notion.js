const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const process_images=require('./process-images.js');
require('dotenv').config();

let pages_database_id="98c44354161641b39e15bbb26816ad33";
let manuscripts_database_id="28f1f92314ac47fb8f89cd302a6f0a90";
let artifacts_database_id="dd406cccfd91406f8207b62effb45912";


let secret=process.env.NOTION_TOKEN;

let image_processing_queue=[];



let acceptable_extension=(filename)=>{
    let fExtension = filename.match(/\.[^/.]+$/)[0];
    let acceptableExt = ['.jpg', '.png', '.jpeg', '.webp'];
    return fExtension && acceptableExt.includes(fExtension.toLowerCase());
}


const notion = new Client({
    auth: secret
})
const n2m = new NotionToMarkdown({ notionClient: notion });
n2m.setCustomTransformer("image", async (block) => {
    // console.log(block)
    // const { image } = block;
    // let def=await n2m.blockToMarkdown(image);
    return '';
  });

  n2m.setCustomTransformer("callout", async (block) => {
    // console.log(block.callout);
        // TODO: FETCH CHILDREN TO GET IMAGES
        // COME UP WITH PARSING SYSTEM
    return '';
  });


const delay = (t) => new Promise(resolve => setTimeout(resolve, t));

async function fetch_database(database_id,{sort_prop,include_content=false,archive_type}){
    let has_more=true;
    let next_cursor;

    let results=[];

    let counter=1;
    
    while(has_more){
        console.log('      loading page '+counter);
        counter++;
        let req_obj={
            database_id
        };
        if(next_cursor) req_obj.start_cursor=next_cursor;
        if(sort_prop) req_obj.sorts=[{property:sort_prop,direction:"ascending"}];
        let data=await notion.databases.query(req_obj)
        results=[...results,...data.results];
        has_more=data.has_more;
        if(has_more){
            next_cursor=data.next_cursor;
            await delay(1000);
        }
    }


    results=results.map(a=>{
        // console.log(a.properties);
        let properties={};
        let manuscript_id=a?.properties?.manuscript_id?.number;
        let artifact_subid=a?.properties?.artifact_subid?.number;

        for(let prop of Object.keys(a.properties)){
            let b=a.properties[prop];
            switch(b.type){
                case 'title':
                    properties[prop]= {
                        type:'title',
                        value:b.title[0]?.plain_text || ''
                    }
                    break;
                case 'number':
                    properties[prop]=  {
                        type:'number',
                        value:b.number
                    }
                    break;
                case 'select':
                    properties[prop]=  {
                        type:'select',
                        value:b.select?.name || ''
                    }
                    break;
                case 'rich_text':
                    properties[prop]=  {
                        type:'rich_text',
                        value:b.rich_text
                    }
                    break;
                case 'files':
                    
                    let input_file_array=b.files;

                    let output_file_array=[];

                    for(let file of input_file_array){
                        if(file.type=='file'&&acceptable_extension(file.name)){
                            let metadata={
                                manuscript_id,
                                sizes:['sm','lg']
                            }
                            if(archive_type=='artifact'){
                                metadata.artifact_subid=artifact_subid;

                            }

                            output_file_array.push({
                                type:'image',
                                name:archive_type=='artifact'?file.name:'scan'
                            })
                            
                            image_processing_queue.push({
                                type:archive_type,
                                url:file.file.url,
                                name:file.name,
                                metadata
                            })
                        }else if(file.type=='external'){
                            output_file_array.push({
                                type:'embed',
                                url:file.external.url
                            })
                        }
                        
                    }
                 
                    properties[prop]=  {
                        type:'files',
                        value:output_file_array
                    }
                    break;
                default:
                    properties[prop]=  {
                        type:b.type,
                        value:b[b.type]
                    }
            }
        }
  


        return {
            item_id:a.id,
            properties
        }
    })

    if(include_content){
        for(let item of results){
            let mdcontent=[];
            console.log(`   loading ${item.properties.title.value}`)
            
            mdcontent=await n2m.pageToMarkdown(item.item_id);
            mdcontent=mdcontent.map(a=>{
                return {
                    type:a.type,
                    value:a.parent
                }
            })
            await delay(1000);
            
            item.mdcontent=mdcontent
        }
        
    }
    
    return results;
}


// function parse_rich_text(elements){
    
// }

module.exports = async function load_data({do_image_processing=false}={}){
    console.log('loading notion data...')

    console.log('   loading manuscripts')
    let manuscripts=await fetch_database(manuscripts_database_id,{archive_type:'manuscript'});
    await delay(500);
    console.log('   loading artifacts')
    let artifacts=await fetch_database(artifacts_database_id,{archive_type:'artifact'});
    console.log('   loading pages')
    let pages=await fetch_database(pages_database_id,{sort_prop:'nav_order',include_content:true});
    

    let cms={
        manuscripts,
        artifacts,
        pages
    };
    
    if(do_image_processing){
        console.log('downloading and processing new images...')
        await process_images(image_processing_queue,cms)
    }

    return cms
}

// load_data();


