import {DnsCategory} from "./src/site/category/dns/DnsCategory";

import {AlkostoCategory} from "./src/site/category/test/AlkostoCategory";



import {DnsDetail} from "./src/site/detail/dns/DnsDetail";
import {ShoppeDetail} from "./src/site/detail/shopee/ShoppeDetail";

import {MakroDetail} from "./src/site/detail/makro/MakroDetail";

import {options as chromeConfig} from "./src/config/chrome/ChromeConfig";

import {DnsKeywordList} from "./src/site/list/dns/DnsKeywordList";
import {MakroList} from "./src/site/list/makro/MakroList";
import {DiorScrap} from "./src/site/list/prada/DiorScrap";
import {PradaImageList} from "./src/site/list/prada/PradaImageList";
import {ShopeeList} from "./src/site/list/shopee/ShopeeList";
import {OechsleCategory} from "./src/site/category/oechsle/OechsleCategory";
import {OechsleList} from "./src/site/list/oechsle/OechsleList";
import {OechsleDetail} from "./src/site/detail/oechsle/OechsleDetail";
import {PowerBuyCategory} from "./src/site/category/powerBuy/PowerBuyCategory";
import {PowerBuyList} from "./src/site/list/powerBuy/PowerBuyList";
import {PowerBuyDetail} from "./src/site/detail/powerBuy/PowerBuyDetail";
import {WineList} from "./src/site/list/wine/WineList";



async function launch(){
    const category = {}


    /*
    const item = await new PowerBuyCategory(chromeConfig,'lg.powerbuy.co.th',[])
        .getCategory({})


     */

    //makro 카테고리
    /*
    const item = await new makroCategory(chromeConfig,'lg.makro.co.za',[])
        .getCategory({})

     */


    /*

    const item = await new ShoopeeCategory(chromeConfig,'lg.shopee.vn',[])
        .getCategory({})


     */
    /*
    const item = await new OechsleCategory(chromeConfig,'lg.shopee.vn',[])
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
    category['categoryUrl'] = "https://shopee.vn/Th%E1%BB%9Di-Trang-Nam-cat.11035567"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new ShopeeList(chromeConfig,'lg.makro.co.za').getItemUrls(category)

     */


    /*

    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://www.oechsle.pe/tecnologia/accesorios-de-computo/monitores/"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new OechsleList(chromeConfig,'lg.makro.co.za').getItemUrls(category)


     */



    /*

    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://www.dior.com/ko_kr/fashion/%EC%97%AC%EC%84%B1-%ED%8C%A8%EC%85%98/%EC%97%AC%EC%84%B1-%EA%B0%80%EB%B0%A9/%EB%AA%A8%EB%93%A0-%EA%B0%80%EC%A3%BD%EC%A0%9C%ED%92%88"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new DiorScrap(chromeConfig,'lg.makro.co.za').getItemUrls(category)
     */


    /*
    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://shopee.vn/search?keyword=t%E1%BB%A7%20l%E1%BA%A1nh"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new ShopeeList(chromeConfig,'lg.makro.co.za').getItemUrls(category)


     */



    /*
    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://www.powerbuy.co.th/th/home-appliance/washing-machines/front-load"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new PowerBuyList(chromeConfig,'lg.makro.co.za').getItemUrls(category)




     */
    // detail용 실행

    /*
    const item = await new DnsDetail(chromeConfig,'lg.dns-shop.ru')
        .extractItemDetail("https://www.dns-shop.ru/product/232ec529f8212ff2/fen-enchen-air-hair-dryer-basic-version-belyj")



 */
//makro detail/*



    /*
    const item = await new MakroDetail(chromeConfig,'lg.makro.co.za')
        .extractItemDetail("https://www.makro.co.za/beverages-liquor/soft-drinks-juices/cold-drinks/2l-non-returnable-bottles/schweppes-lemonade-soft-drink-1l/p/00000340000000035383_EA")




     */


    /*
    const item = await new PowerBuyDetail(chromeConfig,'lg.powerbuy.th')
        .extractItemDetail("https://www.powerbuy.co.th/th/product/hisense-led-tv-65-hisense-4k-google-tv-65a6500h-279172")


     */





    /*
    const item = await new ShoppeDetail(chromeConfig,'lg.dns-shop.ru')
        .extractItemDetail("https://shopee.vn/%C3%81o-Kho%C3%A1c-D%C3%B9-2-L%E1%BB%9Bp-Nam-N%E1%BB%AF-Unisex-Tag-Nh%E1%BB%B1a-DUMBLE-Homies-Saigon-i.63844308.14286637404?sp_atk=adc87478-f809-4012-9885-c3a2a3c662d1&xptdk=adc87478-f809-4012-9885-c3a2a3c662d1")
    //console.log(JSON.stringify(item))

     */

    /*
    const item = await new OechsleDetail(chromeConfig,'lg.dns-shop.ru')
        .extractItemDetail("https://www.oechsle.pe/galaxy-tab-a8-wi-fi--10-5--3gb-ram--32gb-sm-x200nzalpeo/p")
    console.log(item)


     */

/*
    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://www.wine21.com/13_search/wine_list.html"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new WineUrlList(chromeConfig,'lg.makro.co.za').getItemUrls(category)


 */

    category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
    category['categoryUrl'] = "https://www.wine21.com/13_search/wine_list.htm"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new WineList(chromeConfig,'lg.makro.co.za').getItemUrls()

    console.log(item)
    //console.log(JSON.stringify(item))
}



launch();