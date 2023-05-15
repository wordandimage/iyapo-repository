
const marked = require('marked');

module.exports = function (eleventyConfig) {


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
