const scrapeIt = require("scrape-it");
const fs = require('fs');
var _ = require('underscore');

var max_items_array = [];
var product_details = [];
// Sample
var startUrl = "https://www.banggood.com/search/mi-5-case.html";
var scrapperSearchObject =     
{
    products : {
        listItem : ".goodlist_1 > li",
        data : {
            product : ".title a",
            product_link : {
                selector: ".title a"
                , attr: "href"
            }
        }
    }
    ,nextPage : {
        selector: ".page_common > .page_num > #listNextPage"
        , attr: "href"
    }

};
var scrapperItemObject = {
    product_name : ".good_main > h1",
    sold : ".sold",
    product_id : ".productid",
    shipping : ".shipping > .item_con > .changePrice",
    price : ".price > .item_con > now"
}

var search_callbackFunction = (err, page) => {
    if(page){
        wait(10000);
        max_items_array_temp = page.products.map(obj => {
            return {
                product : obj.product,
                product_link : obj.product_link
            }
        });
        max_items_array = max_items_array.concat(max_items_array_temp);
        if(page.nextPage){
            let page_url = page.nextPage;
            console.log(page_url);
            scrapeIt(page_url,scrapperSearchObject,search_callbackFunction);
        } else {
            max_items_array = _.uniq(max_items_array, function(p){ return p.product_link; });
            console.log(max_items_array);
            fs.writeFile('sample.json', JSON.stringify(max_items_array, null, 4), function(err){
                console.log('File successfully written! - Check your project directory for the output.json file');
                max_items_array.push({product : "", product_link : "https://www.google.com/"});
                for (var index = 0; index < max_items_array.length; index++) {
                    console.log(new Date() + max_items_array[index].product);
                    scrapeIt(max_items_array[index].product_link,scrapperItemObject,item_callbackFunction);
                }
            });
            
        }
    }
};
var item_callbackFunction =  (err, page) => {
    
    if(page){
        wait(10000);
        console.log(page);
        product_details.push(page);
        console.log(new Date() + page.product_name);
    }
    if(!page.product_name){
        console.log(product_details);
        fs.writeFile('product_details.json', JSON.stringify(product_details, null, 4), function(err){
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

//scrape(startUrl,scrapperSearchObject,search_callbackFunction)

scrapeIt("https://www.banggood.com/UCASE-Bumblebee-TPUPC-Hard-Back-Case-Cover-for-Xiaomi-Mi5-p-1060266.html?rmmds=search",scrapperItemObject,item_callbackFunction);