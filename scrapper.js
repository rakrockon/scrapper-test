const cheerio = require('cheerio'), // Basically jQuery for node.js 
    _ = require('underscore'),
    rp = require('request-promise'),
    fs = require('fs')
    json2csv = require('json2csv');

var main_details = [];
var pageCount = 1;
var itemCount = 0;
var iteration = 1;
var nextPage;

//********************ali express******************
var scrapping_options = {
    start_url : "https://www.aliexpress.com/category/16080702/essential-oil.html?site=glo&g=y&attrRel=or&pvId=200000578-352949&isrefine=y",
    links_output_file : "ali_links",
    product_details_output_file : "ali",
    scrapper_delay : 15000,
    start : 0,
    end : 100,
    products_box : ".list-item",
    products_name : ".item .info h3 a",
    products_link : ".item .info h3 a",
    next_page_link : ".ui-pagination-navi .page-next",
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
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
        console.log("EXCEL SHEET is created :"+file_name+'.csv file saved');
    });
}


function sanatizeUrl(url){
    if(!url.toLowerCase().includes("http:")){
        url = "https:"+url;
    }
    //var n = url.indexOf('?');
    //url = url.substring(0, n != -1 ? n : url.length);
    return url;
}

function Main(search_url){
    console.log("###### Search page"+ pageCount);
    var start_options = {
        uri: search_url,
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
            console.log(err);
        });
    function ScrapSearchPages($page){
        wait(scrapping_options.scrapper_delay);
        var links_details = [];
        var links = $page(scrapping_options.products_box);
        links.each(function (i, link) {
            itemCount++;
            var url = $page(link).find(scrapping_options.products_link).attr("href");
            var name = $page(link).find(scrapping_options.products_name).text();
            var link_obj = {
                    sno : itemCount,
                    name : name,
                    link : url
            }
            links_details.push(link_obj);
            links_details = _.uniq(links_details, function(p){ return p.link; });
        });
        nextPage = $page(scrapping_options.next_page_link).attr('href');  
        scrapLinks(links_details);
    }
}

function scrapLinks(links_details) {
    var max =  links_details.length;
    var start = 0;
    console.log(links_details[start]);
    scrapPage(links_details[start],links_details,scrapping_options.start,scrapping_options.end);

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
                console.log(new Date() +" scarrping details page:"+linkPage.sno);
                wait(scrapping_options.scrapper_delay);
                ScrapDetails($,linkPage);
                writeFiletoJSON(main_details, scrapping_options.product_details_output_file);
                writeFiletoCSV(main_details, scrapping_options.product_details_output_file);
                
                if(!links_details[current+1]){
                    pageCount++;
                    Main(sanatizeUrl(nextPage));
                }
                if(current+1 !== max){
                    scrapPage(links_details[current+1], links_details, current+1, max);
                }
            })
            .catch(function (err) {
                // Crawling failed or Cheerio choked... 
            });
        function ScrapDetails($sub_page,product){
            var image_box = $sub_page("#j-image-thumb-list li");
            var images = [];
            image_box.each(function (i, img) {
                images.push($sub_page(img).find('img').attr('src'))
            });
            var variation_check =  $sub_page('#j-sku-list-2 li');
            var variation_check1 =  $sub_page('#j-sku-list-1 li');
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
    }
}

Main(scrapping_options.start_url);