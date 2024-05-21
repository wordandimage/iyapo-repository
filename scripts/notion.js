const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { AssetCache } = require("@11ty/eleventy-fetch");
const process_images=require('./process-images.js');
const slugify = require('slugify');
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


const delay = (t) => new Promise(resolve => setTimeout(resolve, t));

async function fetch_parse_block_content(block_id){
    let has_more=true;
    let next_cursor;

    let results=[];

    while(has_more){
        let req_obj={
            block_id,
            page_size: 100,
        };
        if(next_cursor) req_obj.start_cursor=next_cursor;
        let data=await notion.blocks.children.list(req_obj)
        results=[...results,...data.results];
        has_more=data.has_more;
        if(has_more){
            next_cursor=data.next_cursor;
            await delay(500);
        }
    }

    let content=[];

    for(let block of results){
        
        let item;

        if(block.type=='image'){
            let metadata={
                sizes:['md','lg']
            }

            let filename=slugify(block.id.replace(/\.[^/.]+$/, ''))
            
            item={
                type:'image',
                value:{
                    name:filename,
                    caption:block.image.caption.map(a=>a.plain_text)
                }
            }

            image_processing_queue.push({
                type:'standalone',
                url:block.image.file.url,
                name:filename,
                metadata
            })
        }else if(block.type=='callout'){
            let items=[];
            if(block.has_children){
                items=await fetch_parse_block_content(block.id)
            }

            let valid_custom_types=['gallery','diptych','group'];

            let config=block.callout.rich_text[0]?.plain_text?.toLowerCase()?.split(':')?.map(a=>a.trim()) || []
            let type=config[0];
            if(config.length==1&&type=='gallery') config.push('regular')
            if(valid_custom_types.includes(type)) item={
                type,
                value:{
                    options:config?.slice(1),
                    items
                }
            }
        }else if(block.type=='bulleted_list_item'){
            let n2m_output=await n2m.blockToMarkdown(block);
            
            item={
                type:'list',
                value:{
                    text:n2m_output
                }
            }

            if(block.has_children) item.value.items=await fetch_parse_block_content(block.id);
        }else{
            let n2m_output=await n2m.blockToMarkdown(block)
            item={
                type:block.type,
                value:n2m_output
            };
        }

        if(item) content.push(item);
        
    }
    
    return content;
}



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

                            let filename=slugify(file.name.replace(/\.[^/.]+$/, ''))
                            

                            output_file_array.push({
                                type:'image',
                                name:archive_type=='artifact'?filename:'scan'
                            })
                            
                            image_processing_queue.push({
                                type:archive_type,
                                url:file.file.url,
                                name:filename,
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
    
            console.log(`   loading ${item.properties.title.value} content`)
            let mdcontent=await fetch_parse_block_content(item.item_id);


            // let special_types=[

            // ]


            

            // console.log(`   loading ${item.properties.title.value}`)
            // let content=await notion.blocks.children.list({
            //     block_id: item.item_id,
            //     page_size: 100,
            //   });
            // console.log(content);
            
            // mdcontent=await n2m.pageToMarkdown(item.item_id);
            // mdcontent=mdcontent.map(a=>{
            //     return {
            //         type:a.type,
            //         value:a.parent
            //     }
            // })
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
    console.log('   compiling tags')
    let tags={narrative:[],domain:[],object:[]}
    for(let manuscript of manuscripts){
        let narrative=manuscript.properties.narrative.value;
        let object=manuscript.properties.object.value;
        let domain=manuscript.properties.domain.value;
        if(narrative&&!tags.narrative.some(a=>a==narrative)) tags.narrative.push(narrative)
        if(object&&!tags.object.some(a=>a==object)) tags.object.push(object)
        if(domain&&!tags.domain.some(a=>a==domain)) tags.domain.push(domain)
    }

    let cms={
        manuscripts,
        artifacts,
        pages,
        tags
    };
    
    if(do_image_processing){
        console.log('downloading and processing new images...')
        let img_data=await process_images(image_processing_queue,cms);
        let img_cache = new AssetCache("img_data");
        img_cache.save(img_data, "json");
    }

    return cms;
}

// load_data();


