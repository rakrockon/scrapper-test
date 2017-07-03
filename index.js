const scrapeIt = require("scrape-it");
const cheerio = require('cheerio'), // Basically jQuery for node.js 
    _ = require('underscore'),
    rp = require('request-promise'),
    fs = require('fs');

var quotes_Array = [];
// Sample
var startUrl = "https://www.aliexpress.com/item/SPF50-Sunscreen-Concealer-Moisturizing-Foundation-Makeup-Bare-Air-Cushion-BB-Cream/32591936867.html?spm=2114.01010208.3.1.Nyq55L&ws_ab_test=searchweb0_0,searchweb201602_5_10152_10065_10151_10068_10130_10084_10083_10080_10082_10081_10110_10178_10136_10137_519_10111_10060_10112_10113_10155_10114_437_10154_10056_10055_10054_10182_10059_303_100031_10099_10078_10079_10103_10073_10102_10052_10053_10142_10107_142_10050_10051,searchweb201603_49,ppcSwitch_5&btsid=c09cb5ee-fecb-4382-a8b5-a5c64ab872a7&algo_expid=3d1ecc9b-47d8-446d-a38a-817238ee96c0-0&algo_pvid=3d1ecc9b-47d8-446d-a38a-817238ee96c0";

var scrapperObject = {
    name : ".detail-main .product-name",
    price : "#j-sku-price",
    rating : ".percent-num",
    brnad_name : "#product-prop-2 .propery-des",
    type : "#product-prop-351 .propery-des",
    benifit : "#product-prop-200001174 .propery-des",
    formulation : "#product-prop-200001170 .propery-des",
    size : "#product-prop-491 .propery-des",
    sublock : "#product-prop-200001185 .propery-des",
    net_weight : "#product-prop-200000581 .propery-des",
    skin_type : "#product-prop-200001171 .propery-des",
    packagin_details : "#j-product-desc .product-packaging-list"
}
var callbackFunction = (err, page) => {
    if(page){
        console.log(page);
        fs.writeFile('output.json', JSON.stringify(page, null, 4), function(err){

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
//scrape(startUrl,scrapperObject,callbackFunction)
var options = {
    uri: startUrl,
    transform: function (body) {
        return cheerio.load(body);
    },
    resolveWithFullResponse: true
};
rp(options)
.then(function ($sub_page) {

    var temp_data = $sub_page('#j-detail-gallery-main script').get()[0].children[0].data ;
    var images_string=temp_data.substring(temp_data.lastIndexOf("[")+1,temp_data.lastIndexOf("]"));
    var data = {
        product_link : startUrl,
        name : $sub_page(".detail-main .product-name").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        price : $sub_page("#j-sku-price").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        rating : $sub_page(".percent-num").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        images : images_string.replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        brnad_name : $sub_page("#product-prop-2 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        type : $sub_page("#product-prop-351 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        benefit : $sub_page("#product-prop-200001174 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        formulation : $sub_page("#product-prop-200001170 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        size : $sub_page("#product-prop-491 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        sublock : $sub_page("#product-prop-200001185 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        net_weight : $sub_page("#product-prop-200000581 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        skin_type : $sub_page("#product-prop-200001171 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        packagin_details : $sub_page("#j-product-desc .product-packaging-list").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        description_text : $sub_page(".description-content").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),

    }
    fs.writeFile('output.json', JSON.stringify(data, null, 4), function(err){

        console.log('File successfully written! - Check your project directory for the output.json file');

    })
})
.catch(function (err) {
    // Crawling failed or Cheerio choked... 
});