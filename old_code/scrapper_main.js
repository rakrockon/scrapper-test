const cheerio = require('cheerio'), // Basically jQuery for node.js 
    _ = require('underscore'),
    rp = require('request-promise'),
    fs = require('fs'),
    json2csv = require('json2csv');
var links_details = [];
var main_details = [];
var itemCount = 0;
var pageCount = 0;
var totalItems = 0;
//********************testing******************
/*var scrapping_options = {
    start_url : "http://quotes.toscrape.com",
    products_box : ".quote",
    products_name : ".author",
    products_link : "span a",
    next_page_link : ".next a"
}*/
//********************amazon india******************
var scrapping_options = {
    start_url : "http://www.amazon.in/s/ref=nb_sb_ss_c_2_7?url=search-alias%3Dbeauty&field-keywords=bb+cream&sprefix=bb+crea%2Caps%2C488&crid=14DNCB48AJMFY",
    products_box : ".s-result-item",
    products_name : ".s-access-detail-page h2",
    products_link : ".s-access-detail-page",
    next_page_link : "#pagnNextLink",
    links_output_file : "amazon_links",
    details_outout_file : "amazon_details_new",
    scrapper_delay : 10000,
    havePages : false,
    start : 0,
    end : 100,
    counter : 100,
    search_page_limit : 10
}
//********************ali express******************
/*var scrapping_options = {
    start_url : "https://www.aliexpress.com/wholesale?initiative_id=RS_20170702070208&site=glo&g=y&SearchText=goji+cream&page=7&user_click=y",
    products_box : "#hs-list-items .list-item",
    products_name : ".item .info h3 a",
    products_link : ".item .info h3 a",
    next_page_link : ".ui-pagination-navi .page-next",
    links_output_file : "ali_bb_cream_links.json",
    details_outout_file : "ali_bb_cream_product_details.json",
    scrapper_delay : 10000,
    havePages : true,
    start : 0,
    end : 100,
    counter : 100,
    search_page_limit : 10
}*/

function Main(){
     
    if(scrapping_options.havePages){
        var links_data;
        fs.readFile('amazon_links.json', 'utf8', function (err, data) {
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
    if(!url.toLowerCase().includes("https:")){
        url = "https:"+url;
    }
    if(url.toLowerCase().includes("slredirect")){
        return undefined;
    }
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
    if(nextPage && pageCount < scrapping_options.search_page_limit){
        pageCount++;
        scrapNextPage();
    } else {
        writeFiletoJSON(links_details,scrapping_options.links_output_file)
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
    var link_page_options = {
        uri: linkPage.link,
        transform: function (body) {
            return cheerio.load(body);
        },
        resolveWithFullResponse: true
    };
    var isValidLink = sanatizeUrl(linkPage.link);
    if(!isValidLink){
        if(current+2 !== max){
            wait(scrapping_options.scrapper_delay);
            scrapPage(links_details[current+2], links_details, current+2, max)
        } else {
            writeFiletoJSON(main_details, scrapping_options.details_outout_file+"_till_"+max);
            var new_start = max+1;
            var new_end = scrapping_options.counter + max;
            if(new_end < totalItems){
                scrapPage(links_details[new_start],links_details,new_start,new_end);
            }
        }
    } else {
        rp(link_page_options)
        .then(function ($) {
            console.log(new Date() +" scarrping details page started");
            console.log(linkPage.link)
            ScrapDetails($);
            console.log(new Date() +" scarrping details page ended");
            if(current+1 !== max){
                wait(scrapping_options.scrapper_delay);
                scrapPage(links_details[current+1], links_details, current+1, max)
            } else {
                writeFiletoJSON(main_details, scrapping_options.details_outout_file+"_till_"+max);
                var new_start = max+1;
                var new_end = scrapping_options.counter + max;
                if(new_end < totalItems){
                    scrapPage(links_details[new_start],links_details,new_start,new_end);
                }
            }
        })
        .catch(function (err) {
            // Crawling failed or Cheerio choked... 
        });
    }
    //console.log(linkPage);
}

// Scrapper function to get product details
function ScrapDetails($sub_page){
    // ********** MAKE THIS GENERIC ***************** //

    // AMAZON INDIA

    var data = {
        product_link : linkPage.link,
        name : $sub_page("#title").text().replace(/[\n\t\r]/g,"").trim(),
        price : $sub_page("#priceblock_ourprice").text().replace(/[\n\t\r]/g,"").trim(),
        image : $sub_page("#landingImage").attr("src"),
        description : $sub_page("#feature-bullets").text().replace(/[\n\t\r]/g,"").trim()
    }

    // ALI EXPRESS
/*    
    var temp_data = $sub_page('#j-detail-gallery-main script').get()[0].children[0].data ;
    var images_string=temp_data.substring(temp_data.lastIndexOf("[")+1,temp_data.lastIndexOf("]"));
    var data = {
        product_link : linkPage.link,
        name : $sub_page(".detail-main .product-name").text().replace(/[\n\t\r]/g,"").trim(),
        price : $sub_page("#j-sku-price").text().replace(/[\n\t\r]/g,"").trim(),
        rating : $sub_page(".percent-num").text().replace(/[\n\t\r]/g,"").trim(),
        images : images_string.replace(/[\n\t\r]/g,"").trim(),
        brnad_name : $sub_page("#product-prop-2 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        type : $sub_page("#product-prop-351 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        benefit : $sub_page("#product-prop-200001174 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        formulation : $sub_page("#product-prop-200001170 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        size : $sub_page("#product-prop-491 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        sublock : $sub_page("#product-prop-200001185 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        net_weight : $sub_page("#product-prop-200000581 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        skin_type : $sub_page("#product-prop-200001171 .propery-des").text().replace(/[\n\t\r]/g,"").trim(),
        packagin_details : $sub_page("#j-product-desc .product-packaging-list").text().replace(/[\n\t\r]/g,"").trim(),
        description_text : $sub_page(".description-content").text().replace(/[\n\t\r]/g,"").trim(),

    }*/
    console.log(data);
    main_details.push(data);
}

function writeFiletoJSON(object, file_name){
    fs.writeFile(file_name+".json", JSON.stringify(object, null, 4), function(err){
        console.log('File successfully written! - Check your project directory for the output.json file');
    });
}

Main();
