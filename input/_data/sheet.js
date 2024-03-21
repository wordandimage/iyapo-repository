const EleventyFetch = require("@11ty/eleventy-fetch");

let sheets=[
  {'sheet':'pages','id':0},
  {'sheet':'manuscripts','id':1869229058}
]


module.exports = async function() {
  for(let sheet of sheets){
       let url=` https://docs.google.com/spreadsheets/d/e/2PACX-1vTkSC6EPlmAmJ5Oz263x3QtpSGIyURr6SkDlHtHzI_Qvm4IEM7W1Odje5w53RrjPhFEg8snLrqCn8R0/pub?gid=${sheet.id}&single=true&output=tsv`
       let tsv = await EleventyFetch(url, {
          duration: "30s", // save for half a day
          type: "text"    // we’ll parse JSON for you
        });
        let data=typeof tsv === "string"?parse_tsv(tsv,true):[];
        console.log(tsv,typeof tsv)
        sheet.data=data;
  }

  console.log(sheets)

  return sheets;

  
  };



  function parse_tsv(tsv,has_head){
    let rows = tsv.split('\r\n');
    console.log(rows)

    let data=[];

    let keys=[];
    for (let r=0; r<rows.length; r++) {
        let cells=rows[r].split('\t');
        if(has_head&&r==0){
          keys=cells;
        }else if(!has_head){
          data.push(cells);
        }else{
          let obj={}
          for(let c=0;c<cells.length;c++){
            obj[keys[c]]=cells[c];
          }
          data.push(obj);
        }
    }

    return data;


  }



// let spreadsheet_id="1iQE4ciZmTP-tJXaCgQFoQ8qJ2zK-0meG735Ai0VieJk";


// https://docs.google.com/spreadsheets/d/e/2PACX-1vTkSC6EPlmAmJ5Oz263x3QtpSGIyURr6SkDlHtHzI_Qvm4IEM7W1Odje5w53RrjPhFEg8snLrqCn8R0/pub?gid=1869229058&single=true&output=tsv

// https://docs.google.com/spreadsheets/d/e/2PACX-1vTkSC6EPlmAmJ5Oz263x3QtpSGIyURr6SkDlHtHzI_Qvm4IEM7W1Odje5w53RrjPhFEg8snLrqCn8R0/pub?gid=0&single=true&output=tsv


