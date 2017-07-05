const cheerio = require('cheerio'), // Basically jQuery for node.js 
    _ = require('underscore'),
    rp = require('request-promise'),
    fs = require('fs')
    json2csv = require('json2csv');

var links_details = [];
var main_details = [];
var itemCount = 0;
var pageCount = 0;
var totalItems = 0;
var iteration = 1;

//********************ali express******************
var scrapping_options = {
    start_url : "https://www.aliexpress.com/category/66010313/makeup-sets.html?spm=2114.11010108.111.19.3oBXNU",
    links_output_file : "ali_links",
    product_details_output_file : "ali",
    scrapper_delay : 15000,
    havePages : false,
    start : 0,
    end : 10,
    search_page_limit : 1,
    products_box : ".list-item",
    products_name : ".item .info h3 a",
    products_link : ".item .info h3 a",
    next_page_link : ".ui-pagination-navi .page-next",
    counter : 20,
}

function Main(){
     
    if(scrapping_options.havePages){
        var links_data;
        fs.readFile("ali_express/"+scrapping_options.links_output_file+".json", 'utf8', function (err, data) {
            if (err) throw err;
            links_data = JSON.parse(data);
            totalItems = links_data.length;
            //var max =  links_details.length;
            scrapPage(links_data[scrapping_options.start],links_data,scrapping_options.start,scrapping_options.end);
        });
    } else {
        var start_options = {
            uri: scrapping_options.start_url,
            transform: function (body) {
                return cheerio.load(body);
            },
            resolveWithFullResponse: true
        };

        rp(start_options)
            .then(function ($) {            
                ScrapSearchPages($);
            })
            .catch(function (err) {
                // Crawling failed or Cheerio choked... 
                console.log(err);
            });
    }
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}
   
function sanatizeUrl(url){
    if(!url.toLowerCase().includes("http:")){
        url = "https:"+url;
    }
    /*if(url.toLowerCase().includes("login.aliexpress.com")){
        return undefined;
    }*/
    // uncomment if needed
    /*if(!url.toLowerCase().includes(scrapping_options.start_url.toLowerCase()))
        url = scrapping_options.start_url+url
    */
    return url;
}

function ScrapSearchPages($page){
    console.log(new Date() +" scarrping search page "+pageCount +" started");
    getLinks();
    console.log(new Date() +" scarrping search page"+pageCount +" ended");
    var nextPage = $page(scrapping_options.next_page_link).attr('href');  //Make this generic
    var max_search_page_limit = scrapping_options.search_page_limit == 0 ? 9999 : scrapping_options.search_page_limit;
    writeFiletoJSON(links_details,scrapping_options.links_output_file);
    if(nextPage && pageCount < max_search_page_limit){
        pageCount++;
        scrapNextPage();
    } else {
        scrapLinks();
    }

    // Get Links Function
    function getLinks(){
        var links = $page(scrapping_options.products_box);
        links.each(function (i, link) {
            // get the href attribute of each link
            itemCount++;
            var url = $page(link).find(scrapping_options.products_link).attr("href");
            var name = $page(link).find(scrapping_options.products_name).text();
            //console.log(url);
            //url = "http://quotes.toscrape.com"+url;  
            var link_obj = {
                    sno : itemCount,
                    name : name,
                    link : url
            }
            links_details.push(link_obj);
            links_details = _.uniq(links_details, function(p){ return p.link; });
        });
    }

    // scrap Next Page
    function scrapNextPage(){
        nextPage = sanatizeUrl(nextPage);
        //nextPage = "http://quotes.toscrape.com"+nextPage;  //Make this generic
        console.log(new Date() +" before");
        console.log(nextPage);
		wait(scrapping_options.scrapper_delay);
        console.log(new Date() +" after");
        if(!nextPage){
            //skipProduct()
        } else {
            var options = {
                uri: nextPage,
                transform: function (body) {
                    return cheerio.load(body);
                },
                resolveWithFullResponse: true
            };
            rp(options)
            .then(function ($) {            
                ScrapSearchPages($);
            })
            .catch(function (err) {
                // Crawling failed or Cheerio choked... 
            });
        }
    }

}

// Go through all links one by one -- *** Change the logic to make it a batch mode
function scrapLinks() {
    var max =  links_details.length;
    var start = 0;
    totalItems = links_details.length;
    scrapPage(links_details[start],links_details,scrapping_options.start,scrapping_options.end);
}

// Scrap individual link page
function scrapPage(linkPage,links_details,current,max){
    linkPage.link = sanatizeUrl(linkPage.link);
    var link_page_options = {
        uri: linkPage.link,
        transform: function (body) {
            return cheerio.load(body);
        },
        resolveWithFullResponse: true
    };
    rp(link_page_options)
        .then(function ($) {
            console.log(new Date() +" scarrping details page:"+linkPage.sno+" -from "+current+" of "+max+" started");
            //console.log(linkPage.link)
            ScrapDetails($,linkPage);
            console.log(new Date() +" scarrping details page:"+linkPage.sno+" -from "+current+" of "+max+" ended");
            //console.log(main_details);
            writeFiletoJSON(main_details, scrapping_options.product_details_output_file+"_till_"+max);
            writeFiletoCSV(main_details, scrapping_options.product_details_output_file+iteration);
            if(current+1 !== max){
                wait(scrapping_options.scrapper_delay);
                scrapPage(links_details[current+1], links_details, current+1, max);
            } else {
/*                var new_start = max+1;
                var new_end = scrapping_options.counter + max;
                if(new_end < totalItems){
                    scrapPage(links_details[new_start],links_details,new_start,new_end);
                }*/
                iteration++
            }
        })
        .catch(function (err) {
            // Crawling failed or Cheerio choked... 
        });
    //console.log(linkPage);
}

// Scrapper function to get product details
function ScrapDetails($sub_page,product){
    // ********** MAKE THIS GENERIC ***************** //

    // AMAZON INDIA
/*
    var data = {
        name : $sub_page("#title").text().replace(/[\n\t\r]/g,"").trim(),
        price : $sub_page("#priceblock_ourprice").text().replace(/[\n\t\r]/g,"").trim(),
        image : $sub_page("#landingImage").attr("src"),
        description : $sub_page("#feature-bullets").text().replace(/[\n\t\r]/g,"").trim()
    }*/

    // ALI EXPRESS
    var image_box = $sub_page("#j-image-thumb-list li");
    var images = [];
    image_box.each(function (i, img) {
        images.push($sub_page(img).find('img').attr('src'))
    });
    var variation_check =  $sub_page('#j-sku-list-2 li');
    var variation_check1 =  $sub_page('#j-sku-list-1 li');
    var temp_data = $sub_page('#j-detail-gallery-main script').get()[0].children[0].data ;
    var images_string=temp_data.substring(temp_data.lastIndexOf("[")+1,temp_data.lastIndexOf("]"));
    var data = {
        serial_no : product.sno,
        product_link : product.link,
        name : $sub_page(".detail-main .product-name").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        price : $sub_page("#j-sku-price").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        image_1 : images[0]?images[0] : "",
        image_2 : images[1]?images[1] : "",
        image_3 : images[2]?images[2] : "",
        image_4 : images[3]?images[3] : "",
        image_5 : images[4]?images[4] : "",
        image_6 : images[5]?images[5] : "",
        variation : variation_check.length > 0 || variation_check1.length > 1 ? "Yes" : "No",
        brnad_name : $sub_page("#product-prop-2 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        type : $sub_page("#product-prop-351 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        item_type : $sub_page("#product-prop-200000204 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        benefit : $sub_page("#product-prop-200001174 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        formulation : $sub_page("#product-prop-200001170 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        ingrident : $sub_page("#product-prop-1413 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        use : $sub_page("#product-prop-19476 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        size : $sub_page("#product-prop-491 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        feature : $sub_page("#product-prop-973 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        material : $sub_page("#product-prop-10 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        sublock : $sub_page("#product-prop-200001185 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        net_weight : $sub_page("#product-prop-200000581 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        essential_oil_type : $sub_page("#product-prop-200000578 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        hair_type : $sub_page("#product-prop-200007788 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        skin_type : $sub_page("#product-prop-200001171 .propery-des").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim(),
        description : $sub_page(".ui-box-body .product-property-list").text().replace(/[\n\t\r]/g,"").replace(/\s+/g, " ").trim()
    }
    console.log(data.name);
    main_details.push(data);
}

function writeFiletoJSON(object, file_name){
    fs.writeFile("ali_express/"+file_name+".json", JSON.stringify(object, null, 4), function(err){
        //console.log('File successfully written! - Check your project directory for the '+file_name+'.json file');
    });
}
function writeFiletoCSV(object, file_name){
    var csv = json2csv({ data: object });
    fs.writeFile("ali_express/"+file_name+'.csv', csv, function(err) {
        if (err) throw err;
        console.log("EXCEL SHEET is created"+file_name+'.csv file saved');
    });
}

Main();
