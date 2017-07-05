const scrapeIt = require("scrape-it");
const fs = require('fs');
var _ = require('underscore');

var authors_arry = [];
var author_details = [];
// Sample
var startUrl = "http://quotes.toscrape.com/";
var scrapperSearchObject =     
{
    authors : {
        listItem : ".quote",
        data : {
            author : ".author",
            author_link : {
                selector: ".quote span > a"
                , attr: "href"
            }
        }
    },
    nextPage : {
        selector: "nav > .pager > .next > a"
        , attr: "href"
    }

};
var scrapperItemObject = {
    dob : ".author-born-date",
    location : ".author-born-location"
}

var search_callbackFunction = (err, page) => {
    authors_arry_temp = page.authors.map(obj => {
        return {
            author : obj.author,
            author_link : startUrl+obj.author_link
        }
    });
    authors_arry = authors_arry.concat(authors_arry_temp);
    if(page.nextPage){
        let page_url = startUrl+page.nextPage;
        console.log(page_url);
        scrapeIt(page_url,scrapperSearchObject,search_callbackFunction);
    } else {
        console.log(authors_arry);
        authors_arry = _.uniq(authors_arry, function(p){ return p.author_link; });
        fs.writeFile('authors.json', JSON.stringify(authors_arry, null, 4), function(err){
            console.log('File successfully written! - Check your project directory for the output.json file');
        });
        authors_arry.forEach(author_obj =>{
            scrapeIt(author_obj.author_link,scrapperItemObject,item_callbackFunction);
        });
    }
};

var item_callbackFunction =  (err, page) => {
    if(page){
        author_details.push(page);
        fs.writeFile('author_details.json', JSON.stringify(author_details, null, 4), function(err){
            console.log('File successfully written! - Check your project directory for the output.json file');
        });
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

scrape(startUrl,scrapperSearchObject,search_callbackFunction)