
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


    eleventyConfig.addNunjucksFilter( "get_constellation_props", function(item,type,cms) {   
      if(type=='manuscript'){
        let props=[
          {type:'text',label:'Name',value:item.properties.manuscript_name.value},
          {type:'tags',value:{
            narrative: item.properties.narrative.value,
            domain: item.properties.domain.value,
            object: item.properties.object.value
          }},
          {type:'accordion',label:'Description',value:item.properties.manuscript_description.value[0]?.plain_text},
          {type:'relatives',label:'Descendant artifacts',value:cms.artifacts.find(a=>a.properties.manuscript_id.value==item.properties.manuscript_id.value)}
        ]

        return props;
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
