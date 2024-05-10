
const marked = require('marked');
marked.use({mangle: false,headerIds: false});
require('dotenv').config();

module.exports = function (eleventyConfig) {

    eleventyConfig.addNunjucksFilter( "env", function(value) {    
      return process.env[value]
    });

    eleventyConfig.addNunjucksFilter( "notion_data_find", function(array,property,value) {   
      return array.find(item=>item.properties[property].value==value);
    });

    eleventyConfig.addNunjucksFilter("zero_string",function(id){
        let i=id;
        let n = 1;
        if ( i >= 100) { n += 2; i /= 100; }
        if ( i >= 10) { n += 1; }

        let zeros=Array(4 - n).fill('0').join('');

        return `${zeros}${id}`;
    })


    eleventyConfig.addNunjucksFilter( "get_constellation_props", function(item,type,cms) { 
      console.log( item.properties.narrative.value,item.properties.domain.value,item.properties.object.value)  
      if(type=='manuscript'){
        let artifacts=cms.artifacts
          .filter(a=>a.properties.manuscript_id.value==item.properties.manuscript_id.value)
          .map(a=>{
            return {
              url: `archive/artifacts-cluster/artifact-${a.properties.manuscript_id.value}-${a.properties.artifact_subid.value}`,
              image:a.properties.media.value[0]?`assets/images_for_web/archive/manuscript${a.properties.manuscript_id.value}/artifact${a.properties.artifact_subid.value}/img@@${a.properties.media.value[0]?.name}@@sm`:'' 
            }
          })
        
        let props=[
          {type:'text',label:'Name',value:item.properties.manuscript_name.value},
          {type:'tags',value:
          item.properties.narrative.value&&item.properties.domain.value&&item.properties.object.value?{
            narrative: item.properties.narrative.value,
            domain: item.properties.domain.value,
            object: item.properties.object.value
          }:false },
          {type:'accordion',label:'Description',value:item.properties.manuscript_description.value[0]?.plain_text},
          {type:'relatives',label:'Descendant Artifacts',value:artifacts.length>0?artifacts:false}
        ]

        return props.filter(a=>a.value);
      }
    });

    eleventyConfig.addNunjucksFilter( "notion_data_sort_int", function(array,property) {    
      return array.sort((a,b)=>{
        return a.properties[property].value - b.properties[property].value;
      });
    });

    eleventyConfig.addNunjucksFilter( "md", function(value) {    
        var result;
          try {
            result = marked.parse(value)
            return result;
          } catch (e) {
            return "";
          }
      });

    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

    eleventyConfig.setTemplateFormats("html,css,js,njk,otf,woff,woff2,md");
    eleventyConfig.addDataExtension("md", contents => {html:marked.parse(contents)});


    return {
        dir: {
            input: "input",
            output: "_site",
            data: '_data'
        }
    };
};
