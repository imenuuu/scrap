import {DnsCategory} from "./src/site/category/dns/DnsCategory";

import {MakroCategory} from "./src/site/category/makro/MakroCategory";
import {WortenCategory} from "./src/site/category/worten/WortenCategory";
import {ShopeeCategory} from "./src/site/category/shoopee/ShopeeCategory";



import {DnsDetail} from "./src/site/detail/dns/DnsDetail";
import {ShoppeDetail} from "./src/site/detail/shopee/ShoppeDetail";

import {MakroDetail} from "./src/site/detail/makro/MakroDetail";

import {options as chromeConfig} from "./src/config/chrome/ChromeConfig";

import {DnsKeywordList} from "./src/site/list/dns/DnsKeywordList";
import {MakroList} from "./src/site/list/makro/MakroList";

import {ShopeeList} from "./src/site/list/shopee/ShopeeList";
import {PradaList} from "./src/site/list/scrap/PradaList";
import {OechsleCategory} from "./src/site/category/oechle/OechsleCategory";
import {OechsleList} from "./src/site/list/oechle/OechsleList";
import {OechsleDetail} from "./src/site/detail/oechle/OechsleDetail";



async function launch(){
    const category = {}



    //makro 카테고리

    /*
    const item = await new WortenCategory(chromeConfig,'lg.worten.pt',[])
        .getCategory({})

     */

    /*
    const item = await new ShopeeCategory(chromeConfig,'lg.shopee.vn\n',[])
        .getCategory({})



     */

    /*
    const item = await new OechsleCategory(chromeConfig,'lg.shopee.vn\n',[])
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
    category['categoryNameList'] = ["SHOPEEE", "Điện Thoại & Phụ Kiện","Thiết bị khác"]
    category['categoryUrl'] = "https://shopee.vn/search?keyword=t%E1%BB%A7%20l%E1%BA%A1nh213"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new ShopeeList(chromeConfig,'lg.shopee.vn').getItemUrls(category)

     */

    /*
    category['categoryNameList'] = ["SHOPEEE", "Điện Thoại & Phụ Kiện","Thiết bị khác"]
    category['categoryUrl'] = "https://www.oechsle.pe/deportes/maquinas-de-gimnasio/bicicletas-de-spinning"
    category['categoryNameList'] = category['categoryNameList'].join( " > ")
    const item = await new OechsleList(chromeConfig,'lg.oechsle.pe').getItemUrls(category)


     */



    /*

        category['categoryNameList'] = [ 'Makro', ' Appliances', ' Fridges & Freezers', ' Wine Fridges']
        category['categoryUrl'] = "https://www.makro.co.za/electronics-computers/cameras/video-cameras/c/BDR"
        category['categoryNameList'] = category['categoryNameList'].join( " > ")
        const item = await new MakroList(chromeConfig,'lg.makro.co.za').getItemUrls(category)



     */




    // detail용 실행

    /*
    const item = await new DnsDetail(chromeConfig,'lg.dns-shop.ru')
        .extractItemDetail("https://www.dns-shop.ru/product/232ec529f8212ff2/fen-enchen-air-hair-dryer-basic-version-belyj")



 */
//makro detail/*


    /*

    const item = await new MakroDetail(chromeConfig,'lg.makro.co.za')
        .extractItemDetail("https://www.makro.co.za/electronics-computers/computers-tablets/monitors/monitors/leds-touch-panel-86-/p/dd5ce7f8-8a17-4c36-8e93-86db6622da34")



     */


    /*
    const item = await new ShoppeDetail(chromeConfig,'lg.shopee.vn')
        .extractItemDetail("https://shopee.vn/%C3%81o-kho%C3%A1c-th%E1%BB%83-thao-3-s%E1%BB%8Dc-logo-ADD-ch%E1%BA%A5t-ni%CC%89-d%C3%A0y-d%E1%BA%B7n-BIGOMALL-i.746278578.21150081757?sp_atk=2cf34707-3e7f-4647-9856-93f2f21ca2c7&xptdk=2cf34707-3e7f-4647-9856-93f2f21ca2c7")



     */

    const item = await new OechsleDetail(chromeConfig,'lg.oechsle.pe')
        .extractItemDetail("https://www.oechsle.pe/galaxy-tab-a8-wi-fi--10-5--3gb-ram--32gb-sm-x200nzalpeo/p")




    //console.log(JSON.stringify(item))

    console.log(item)


}



launch();