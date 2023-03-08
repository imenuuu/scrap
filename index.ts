import {DnsCategory} from "./src/site/category/dns/DnsCategory";

import {MakroCategory} from "./src/site/category/makro/MakroCategory";
import {AlkostoCategory} from "./src/site/category/test/AlkostoCategory";



import {DnsDetail} from "./src/site/detail/dns/DnsDetail";
import {MakroDetail} from "./src/site/detail/makro/MakroDetail";

import {options as chromeConfig} from "./src/config/chrome/ChromeConfig";

import {DnsKeywordList} from "./src/site/list/dns/DnsKeywordList";
import {MakroList} from "./src/site/list/makro/MakroList";

async function launch(){
    const category = {}



    //makro 카테고리
    /*
    const item = await new makroCategory(chromeConfig,'lg.makro.co.za',[])
        .getCategory({})

     */

    /*
    const item = await new MakroCategory(chromeConfig,'lg.makro.co.za',[])
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
    category['categoryUrl'] = "https://www.makro.co.za/electronics-computers/cellphones/power-banks-chargers/c/BGC"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new MakroList(chromeConfig,'lg.makro.co.za').getItemUrls(category)


 */





    // detail용 실행

    /*
    const item = await new DnsDetail(chromeConfig,'lg.dns-shop.ru')
        .extractItemDetail("https://www.dns-shop.ru/product/232ec529f8212ff2/fen-enchen-air-hair-dryer-basic-version-belyj")



 */
//makro detail/*



    const item = await new MakroDetail(chromeConfig,'lg.makro.co.za')
        .extractItemDetail("https://www.makro.co.za/beverages-liquor/soft-drinks-juices/cold-drinks/2l-non-returnable-bottles/schweppes-lemonade-soft-drink-1l/p/00000340000000035383_EA")



    console.log(JSON.stringify(item))

    //console.log(item)


}



launch();