const scrapeIt = require("scrape-it");
const fs = require('fs');

var quotes_Array = [];
// Sample
var startUrl = "https://www.quora.com/What-are-the-best-tricks-you-know-and-want-to-share/answer/Aakash-Sharma-398";
var scrapperObject =     
{
    quotes : {
        listItem : ".qtext_para",
        data : {
            drive_name: ".qlink_container a",
            drive_link : {
                selector: ".qlink_container a"
                , attr: "href"
            }
        }
    }

}

var callbackFunction = (err, page) => {
    if(page){
        quotes_Array = quotes_Array.concat(page.quotes);
        fs.writeFile('output.json', JSON.stringify(quotes_Array, null, 4), function(err){

            console.log('File successfully written! - Check your project directory for the output.json file');

        })
        
    }
};

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function scrape(url,obj,cb){
    console.log(url);
    scrapeIt(url,obj,cb);
}

scrape(startUrl,scrapperObject,callbackFunction)