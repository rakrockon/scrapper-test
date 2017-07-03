var request = require("request"),
	cheerio = require("cheerio"),
	url = "http://quotes.toscrape.com/",
    _ = require('underscore'),
	
	corpus = {},
	totalResults = 0,
	resultsDownloaded = 0;
const scrapeIt = require("scrape-it");
const fs = require('fs');

var links_arr = [];
var author_details = [];

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

var search_callbackFunction = (err, page) => {
    authors_arry_temp = page.authors.map(obj => {
        return {
            author : obj.author,
            author_link : "http://quotes.toscrape.com"+obj.author_link
        }
    });
    links_arr = links_arr.concat(authors_arry_temp);
    if(page.nextPage){
        let page_url = "http://quotes.toscrape.com"+page.nextPage;
        console.log(page_url);
        scrapeIt(page_url,scrapperSearchObject,search_callbackFunction);
    } else {
        links_arr = _.uniq(links_arr, function(p){ return p.author_link; });
        //console.log(links_arr);
        links_arr.forEach(author_obj =>{
            scrapePage(author_obj.author_link);
        });
    }
}

scrapeIt(url,scrapperSearchObject,search_callbackFunction);


function callback (details) {
	resultsDownloaded++;
	author_details.push(details);
	//console.log(author_details);
	if (resultsDownloaded !== totalResults) {
		return;
	}
	//console.log(author_details);
    fs.writeFile('author_details.json', JSON.stringify(author_details, null, 4), function(err){
        console.log('File successfully written! - Check your project directory for the output.json file');
    });
}


var scrapePage = function(link){
    		// get the href attribute of each link
		var url = link;
		
		// this link counts as a result, so increment results
		totalResults++;
        console.log(new Date() +" before");
		wait(10000);
        console.log(new Date() +" after");
		// download that page
        request(url, function (error, response, body) {
            console.log(new Date() +" request");
            if (error) {
                console.log("Couldn’t get page because of error: " + error +" at "+ url);
                return;
            }
            
            // load the page into cheerio
            var $page = cheerio.load(body);

            var details = {
                author : url,
                dob : $page(".author-born-date").text(),
                location : $page(".author-born-location").text(),
            }
            
            callback(details);
        });
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}