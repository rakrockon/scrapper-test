const scrapeIt = require("scrape-it");
const fs = require('fs');
var _ = require('underscore');

var max_items_array = [];
var product_details = [];
// Sample
var startUrl = "https://www.aliexpress.com/wholesale?catId=0&initiative_id=AS_20170630222257&SearchText=bb+air+gun";
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
var scrapperItemObject = {
    product_name : ".product-name",
    brand : "#product-prop-2 > .propery-des",
    price : ".total-price-show",
    discounted_price : ".p-price"
}

var search_callbackFunction = (err, page) => {
    if(page){
        wait(10000);
        max_items_array_temp = page.products.map(obj => {
            return {
                product : obj.product,
                product_link : "https:"+obj.product_link
            }
        });
        max_items_array = max_items_array.concat(max_items_array_temp);
        if(page.nextPage){
            let page_url = "https:"+page.nextPage;
            console.log(page_url);
            scrapeIt(page_url,scrapperSearchObject,search_callbackFunction);
        } else {
            max_items_array = _.uniq(max_items_array, function(p){ return p.product_link; });
            fs.writeFile('ali_products.json', JSON.stringify(max_items_array, null, 4), function(err){
                console.log('File successfully written! - Check your project directory for the output.json file');
                max_items_array.forEach(product_obj =>{
                    console.log(product_obj.product_link);
                    scrapeIt(product_obj.product_link,scrapperItemObject,item_callbackFunction);
                });
            });
        }
    }
};
var item_callbackFunction =  (err, page) => {
    
    if(page){
        wait(10000);
        product_details.push(page);
        console.log(product_details);
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