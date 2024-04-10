const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
require('dotenv').config();

let pages_database_id="98c44354161641b39e15bbb26816ad33";
let manuscripts_database_id="28f1f92314ac47fb8f89cd302a6f0a90";
let artifacts_database_id="dd406cccfd91406f8207b62effb45912";


let secret=process.env.NOTION_TOKEN;



const notion = new Client({
    auth: secret
})
const n2m = new NotionToMarkdown({ notionClient: notion });


const delay = (t) => new Promise(resolve => setTimeout(resolve, t));

async function fetch_database(database_id,sort_prop,include_content=false){
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

module.exports = async function load_data(){
    console.log('loading notion data...')

    console.log('   loading manuscripts')
    let manuscripts=await fetch_database(manuscripts_database_id);
    await delay(500);
    console.log('   loading artifacts')
    let artifacts=await fetch_database(artifacts_database_id);
    console.log('   loading pages')
    let pages=await fetch_database(pages_database_id,'nav_order',true);
    
    return {
        manuscripts,
        artifacts,
        pages
    }
}

// load_data();


