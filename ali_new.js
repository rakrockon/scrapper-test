var request = require("request"),
	cheerio = require("cheerio"),
	url = "https://www.aliexpress.com/item/SPF50-Sunscreen-Concealer-Moisturizing-Foundation-Makeup-Bare-Air-Cushion-BB-Cream/32591936867.html?spm=2114.01010208.3.1.Nyq55L&ws_ab_test=searchweb0_0,searchweb201602_5_10152_10065_10151_10068_10130_10084_10083_10080_10082_10081_10110_10178_10136_10137_519_10111_10060_10112_10113_10155_10114_437_10154_10056_10055_10054_10182_10059_303_100031_10099_10078_10079_10103_10073_10102_10052_10053_10142_10107_142_10050_10051,searchweb201603_49,ppcSwitch_5&btsid=c09cb5ee-fecb-4382-a8b5-a5c64ab872a7&algo_expid=3d1ecc9b-47d8-446d-a38a-817238ee96c0-0&algo_pvid=3d1ecc9b-47d8-446d-a38a-817238ee96c0",
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
    products : {
        listItem : "#hs-list-items .list-item",
        data : {
            product : ".item .info h3 a",
            product_link : {
                selector: ".item .info h3 a"
                , attr: "href"
            }
        }
    }
    ,nextPage : {
        selector: ".ui-pagination-navi > .page-next"
        , attr: "href"
    }

};

var search_callbackFunction = (err, page) => {
    authors_arry_temp = page.products.map(obj => {
        return {
            product : obj.product,
            product_link : "https:"+obj.product_link
        }
    });
    links_arr = links_arr.concat(authors_arry_temp);
    if(page.nextPage){
        let page_url = "https:"+page.nextPage;
        console.log(new Date() +" before search");
        console.log(page_url);
		wait(10000);
        console.log(new Date() +" after search");
        scrapeIt(page_url,scrapperSearchObject,search_callbackFunction);
    } else {
        links_arr = _.uniq(links_arr, function(p){ return p.product_link; });
        //console.log(links_arr);
        fs.writeFile('product_links.json', JSON.stringify(links_arr, null, 4), function(err){
            console.log('File successfully written! - Check your project directory for the output.json file');
        });
        links_arr.forEach(author_obj =>{
            scrapePage(author_obj.product_link);
        });
    }
}

scrapeIt(url,scrapperSearchObject,search_callbackFunction);


function callback (details,condition) {
    if(condition == "stop"){
        fs.writeFile('product_details.json', JSON.stringify(author_details, null, 4), function(err){
            console.log('File successfully written! - Check your project directory for the output.json file');
        });
    }
	resultsDownloaded++;
	author_details.push(details);
	//console.log(author_details);
	if (resultsDownloaded !== totalResults) {
		return;
	}
	//console.log(author_details);
    fs.writeFile('product_details.json', JSON.stringify(author_details, null, 4), function(err){
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
            if($page(".detail-main .product-name").text() == "" || !$page(".detail-main .product-name")){
                console.log("scarapping stopped at" + url);
                callback("","stop");
            }
            var details = {
                product : $page(".detail-main .product-name").text(),
                orders : $page(".order-num").text(),
                sku : $page("#j-sku-price").text(),
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