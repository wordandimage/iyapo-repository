
const marked = require('marked');
marked.use({mangle: false,headerIds: false});
require('dotenv').config();

module.exports = function (eleventyConfig) {

    eleventyConfig.addNunjucksFilter( "env", function(value) {    
      return process.env[value]
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
