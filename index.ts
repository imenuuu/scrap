import {DnsCategory} from "./src/site/category/dns/DnsCategory";

import {makroCategory} from "./src/site/category/makro/makroCategory";


import {DnsDetail} from "./src/site/detail/dns/DnsDetail";
import {MacroDetail} from "./src/site/detail/makro/MacroDetail";

import {options as chromeConfig} from "./src/config/chrome/ChromeConfig";

import {DnsKeywordList} from "./src/site/list/dns/DnsKeywordList";
import {makroList} from "./src/site/list/makro/makroList";

async function launch(){
    const category = {}



    //매개 변수는 사이트 메인페이지
    /*
    const item = await new makroCategory(chromeConfig,'lg.makro.co.za',[])
        .getCategory({})

     */


     // list용 실행
    /*
     category['categoryNameList'] = ["DNS", "ТВ и мультимедиа", "Телевизоры и аксессуары" ,"Телевизоры"]
     category['categoryUrl'] = "https://www.dns-shop.ru/catalog/17a8ae4916404e77/televizory/"
     category['categoryNameList'] = category['categoryNameList'].join( " > ")
     const item = await new DnsKeywordList(chromeConfig,'lg.dns-shop.ru').getItemUrls(category)

     */
/*

    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://www.makro.co.za/appliances/fridges-freezers/wine-fridges/c/AAC"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new makroList(chromeConfig,'lg.makro.co.za').getItemUrls(category)

 */

    // detail용 실행
/*
    const item = await new DnsDetail(chromeConfig,'lg.dns-shop.ru')
        .extractItemDetail("https://www.dns-shop.ru/product/232ec529f8212ff2/fen-enchen-air-hair-dryer-basic-version-belyj")



 */

    const item = await new MacroDetail(chromeConfig,'lg.makro.co.za')
        .extractItemDetail("https://www.makro.co.za/merchandising-hierarchy/daily-deals/swan-70-l-24-bottle-wine-cooler-/p/000000000000266401_EA")


    console.log(item)
}



launch();