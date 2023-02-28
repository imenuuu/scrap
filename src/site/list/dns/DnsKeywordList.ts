import {ColtBaseUrlItem} from "../../../dto/ColtBaseUrlItem";
import {ColtBaseUrlCate} from "../../../dto/ColtBaseUrlCate";
import {ColtBaseUrlRank} from "../../../dto/ColtBaseUrlRank";
import {ColtShelfItem} from "../../../dto/ColtShelfItem";
import type {AcqList} from "../AcqList";
import {logger} from "../../../config/logger/Logger";

const service = require('../../../config/service.json');
const makeItem = require('../../../util/ItemUtil')
const puppeteer = require('../../../util/PuppeteerUtil');
const cheerio = require('cheerio');
let dateUtils = require('../../../util/DateUtil');
const wait = require('../../../util/WaitUtil')



let stdt : string;

const COLLECT_SITE : string = 'lg.dns-shop.ru'
const SITE_NAME : string = 'DNS'

class DnsKeywordList implements AcqList {

    _glbConfig: { [key: string]: any; };
    collectSite: string;


    constructor(config: { [key: string]: any; }, collectSite: string) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.LIST_PUPPET_PROFILE;
        this.collectSite = collectSite;
    }

    getFilter() {
    }

    /* async getCategory(filterList) {
         let categoryList = new Array();

         let traverseCate = await getTraverseCate();
         for (let [cateName, cateUrl] of traverseCate) {
             let cateObj = {};
             cateObj['name'] = cateName;
             cateObj['cateUrl'] = cateUrl;
             categoryList.push(cateObj)
         }

         let searchCate = await getSearchCate();
         for (let [cateName, word] of searchCate) {
             let cateObj = new Object();
             let searchUrl = 'https://www.dns-shop.ru/search/?q=' + encodeURI(word)
             if(cateName.includes('смарт тв')){
                 searchUrl = searchUrl+'&category=17a8ae4916404e77';
             }
             cateObj['name']  = cateName;
             cateObj['cateUrl'] = searchUrl;
             categoryList.push(cateObj)
         }
         return categoryList;
     }*/
    /**
     * "category" : {"name":"DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры", "url":"https://www.dns-shop.ru/catalog/17a8ae4916404e77/televizory/"}
     *  요청 body
     * @param category
     */

    async getItemUrls(category : any) : Promise<Array<ColtBaseUrlItem>> {

        stdt = await getTurn();

        const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

        let coltBaseUrlList : Array<ColtBaseUrlItem> = new Array();
        let detailPage : any
        let currentUrl : string = '';
        let param : string = '?p=';
        let totalCnt : number;
        try {
            let url : string = category.categoryUrl;
            try {
                await page.goto(url, {waitUntil: ["domcontentloaded"], timeout: 80000});
                await page.waitForSelector('body > div.container.category-child > div > div.products-page__content > div.products-page__list > div.products-list > div > div > div > div.catalog-product__image > a > picture > img', {visible: true});
                await page.waitForSelector('div.product-buy__price', {timeout: 80000});
                await page.mouse.wheel({deltaY: 1000});
                await page.mouse.wheel({deltaY: 1000});
                await page.mouse.wheel({deltaY: 1000});
                await page.mouse.wheel({deltaY: 1000});
            } catch (error) {
                if (error instanceof puppeteer.errors.TimeoutError) {
                    logger.error('TimeOut Error!')
                } else {
                    logger.error(error.stack);
                }
            }
            detailPage = cheerio.load(await page.content());

            //검색어 진입시 redirect되므로 현재 url로 요청보내야함
            if (category.categoryNameList.includes('LGEG')) {
                currentUrl = await page.url();
                if (currentUrl.includes('?')) param = '&p=';
                totalCnt = detailPage('span.products-count')//.text().replaceAll(/\d+ категориях/gm, '').replaceAll(/\d+ категории/gm, '').replaceAll(/\D+/gm, '');
            } else {
                totalCnt = detailPage('div.products-page__title').text().replaceAll(/\d+ категориях/gm, '').replaceAll(/\d+ категории/gm, '').replaceAll(/\D+/gm, '');
                currentUrl = category.categoryUrl;
            }

            totalCnt = totalCnt > 2000 ? 2000 : totalCnt;
            logger.info('#Category: ' + category.categoryNameList + ', List Total Count: ' + totalCnt);
            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' + category.categoryNameList + ' , url -> ' + url)
                return coltBaseUrlList;
            }

            let pageSize : number = 18;
            let pageCnt : number = Math.floor((totalCnt / pageSize));
            let mod : number = (totalCnt % pageSize);
            if (mod > 0) pageCnt = pageCnt + 1;

            for (let pageNum = 1; pageNum <= 1; pageNum++) {
                if (pageNum > 1) {
                    try {
                        let urlUpdate = currentUrl + param + pageNum;
                        await page.goto(urlUpdate, {waitUntil: "domcontentloaded"}, {timeout: 30000})
                        await page.waitForSelector('body > div.container.category-child > div > div.products-page__content > div.products-page__list > div.products-list > div > div > div > div.catalog-product__image > a > picture > img', {visible: true}, {timeout: 15000})
                        await page.waitForSelector('div.product-buy__price', {timeout: 15000});

                        await page.mouse.wheel({deltaY: 1000});
                        await page.mouse.wheel({deltaY: 1000});
                        await page.mouse.wheel({deltaY: 1000});
                        await page.mouse.wheel({deltaY: 1000});
                    } catch (error) {
                        if (error instanceof puppeteer.errors.TimeoutError) {
                            logger.error('TimeOut Error!')
                        } else {
                            logger.error(error.stack);
                        }
                    }

                    let detailPageUpdate : any = cheerio.load(await page.content());
                    parsingItemList(category, detailPageUpdate, pageNum, coltBaseUrlList);

                } else {
                    parsingItemList(category, detailPage, pageNum, coltBaseUrlList);
                }
                await wait.sleep(2);
                logger.info("pageNum: " + pageNum + " , totalList:" + coltBaseUrlList.length);
            }
        } catch (error) {
            logger.error(error.stack);

        } finally {
            await puppeteer.close(browser, page, this._glbConfig)
        }

        return coltBaseUrlList;
    }

}

async function getTurn() : Promise<string> {
    let date = new Date;
    let hour = date.getHours();

    if (hour < 12) {
        let stdt = dateUtils.currentDay() + " 00:00"
        return stdt

    } else {
        let stdt = dateUtils.currentDay() + " 12:00"
        return stdt
    }
}

async function getTraverseCate() : Promise<Map<string,string>> {
    const category = new Map();
    category.set('DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры', 'https://www.dns-shop.ru/catalog/17a8ae4916404e77/televizory/'); //548
    category.set('DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры > LG > 4K UHD', 'https://www.dns-shop.ru/catalog/17a8ae4916404e77/televizory/?brand=lg&f[p4]=3np'); //96
    category.set('DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры > LG > 8K', 'https://www.dns-shop.ru/catalog/17a8ae4916404e77/televizory/?brand=lg&f[p4]=j4qk4'); //1
    category.set('DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры > LG > Full HD', 'https://www.dns-shop.ru/catalog/17a8ae4916404e77/televizory/?brand=lg&f[p4]=3nr'); //8
    category.set('DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры > LG > Nanocell', 'https://www.dns-shop.ru/catalog/recipe/8c0eb14e5126504b/nanocell/'); //26
    category.set('DNS > ТВ и мультимедиа > Телевизоры и аксессуары > Телевизоры > OLED', 'https://www.dns-shop.ru/catalog/recipe/8057e847b3d4950d/oled/'); //17
    category.set('DNS > Бытовая техника > Техника для дома > Летний климат > Кондиционеры (сплит-системы)', 'https://www.dns-shop.ru/catalog/17a8d3a316404e77/kondicionery/'); //346
    category.set('DNS > Бытовая техника > Техника для дома > Уборка > Вертикальные пылесосы', 'https://www.dns-shop.ru/catalog/d79905f0113ab6df/vertikalnye-pylesosy/'); //375
    category.set('DNS > Комплектующие, компьютеры и ноутбуки > Периферия и аксессуары > Мониторы', 'https://www.dns-shop.ru/catalog/17a8943716404e77/monitory/'); //303
    category.set('DNS > Комплектующие, компьютеры и ноутбуки > Периферия и аксессуары > Мониторы > LG', 'https://www.dns-shop.ru/search/?q=MONITOR&brand=lg'); //188
    category.set('DNS > Бытовая техника > Техника для кухни > Холодильное оборудование > Холодильники', 'https://www.dns-shop.ru/catalog/4e2a7cdb390b7fd7/xolodilniki/'); //998
    category.set('DNS > Бытовая техника > Техника для кухни > Холодильное оборудование > Холодильники > LG', 'https://www.dns-shop.ru/catalog/4e2a7cdb390b7fd7/xolodilniki/?brand=lg'); //45
    category.set('DNS > Бытовая техника > Техника для кухни > Холодильное оборудование > Холодильники > Side by Side (LG)', 'https://www.dns-shop.ru/catalog/4e2a7cdb390b7fd7/xolodilniki/?brand=lg&f%5Bryq%5D=g5hr'); //5
    category.set('DNS > Бытовая техника > Техника для дома > Стирка и сушка > Стиральные машины', 'https://www.dns-shop.ru/catalog/c01df46f39137fd7/stiralnye-mashiny/'); //400
    category.set('DNS > Бытовая техника > Техника для дома > Стирка и сушка > Стиральные машины > LG', 'https://www.dns-shop.ru/catalog/c01df46f39137fd7/stiralnye-mashiny/?brand=lg'); //40
    category.set('DNS > Бытовая техника > Техника для дома > Глаженье > Паровые шкафы', 'https://www.dns-shop.ru/catalog/69d6ce34eb887fd7/parovye-shkafy/'); //4
    category.set('DNS > Бытовая техника > Техника для дома > Глаженье > Паровые шкафы > LG', 'https://www.dns-shop.ru/search/?q=STYLER&brand=lg'); //5
    return category;
}


async function getSearchCate() : Promise<Map<string,string>> {
    const searchCate = new Map();
    searchCate.set('LGEG > DNS > холодильник', 'холодильник');  // 2000
    //searchCate.set('LGEG > DNS > французский холодильник' , 'французский холодильник'); // 0 결과없어서 주석처리
    //searchCate.set('LGEG > DNS > верхний морозильник' , 'верхний морозильник'); // 0 결과없어서 주석처리
    searchCate.set('LGEG > DNS > нижний морозильник', 'нижний морозильник'); // 35
    searchCate.set('LGEG > DNS > холодильник side by side', 'холодильник side by side'); // 155
    searchCate.set('LGEG > DNS > стиральная машина', 'стиральная машина'); // 1970
    searchCate.set('LGEG > DNS > фронтальная загрузка', 'фронтальная загрузка'); // 748
    searchCate.set('LGEG > DNS > стиральная машина с сушкой', 'стиральная машина с сушкой'); // 95
    searchCate.set('LGEG > DNS > кондиционер', 'кондиционер'); // 1951
    searchCate.set('LGEG > DNS > бытовой кондиционер', 'бытовой кондиционер'); // 23
    searchCate.set('LGEG > DNS > инверторный кондиционер', 'инверторный кондиционер'); //471
    searchCate.set('LGEG > DNS > сплит система', 'сплит система'); // 1951
    searchCate.set('LGEG > DNS > телевизор', 'телевизор'); // 2000
    searchCate.set('LGEG > DNS > смарт тв', 'смарт тв'); // 1054
    searchCate.set('LGEG > DNS > 4k телевизор', '4k телевизор'); // 692
    searchCate.set('LGEG > DNS > oled телевизор', 'oled телевизор'); // 2000
    searchCate.set('LGEG > DNS > uhd телевизор', 'uhd телевизор'); // 690
    searchCate.set('LGEG > DNS > монитор', 'монитор'); // 2000
    searchCate.set('LGEG > DNS > ультраширокий монитор', 'ультраширокий монитор'); // 0
    searchCate.set('LGEG > DNS > монитор uhd', 'монитор uhd'); // 6
    searchCate.set('LGEG > DNS > игровой монитор', 'игровой монитор'); // 547
    searchCate.set('LGEG > DNS > Беспроводные пылесосы', 'Беспроводные пылесосы'); // 502
    searchCate.set('LGEG > DNS > Вертикальный пылесос', 'Вертикальный пылесос'); // 779
    //searchCate.set('LGEG > DNS > широкий монитор' , 'широкий монитор'); // 0 결과없어서 주석처리
    //searchCate.set('LGEG > DNS > монитор для гейминга' , 'монитор для гейминга'); // 0 결과없어서 주석처리
    searchCate.set('LGEG > DNS > Паровой шкаф', 'Паровой шкаф'); // 8
    searchCate.set('LGEG > DNS > lg Паровой шкаф', 'lg Паровой шкаф'); // 5
    searchCate.set('LGEG > DNS > Оратор', 'Оратор'); // 520
    searchCate.set('LGEG > DNS > Компьютерные колонки', 'Компьютерные колонки'); // 185
    searchCate.set('LGEG > DNS > Портативные колонки', 'Портативные колонки'); // 1485
    searchCate.set('LGEG > DNS > Bluetooth-колонки', 'Bluetooth-колонки'); // 1063
    searchCate.set('LGEG > DNS > Портативные колонки bluetooth', 'Портативные колонки bluetooth'); // 827
    searchCate.set('LGEG > DNS > Наушники', 'Наушники'); // 2000
    searchCate.set('LGEG > DNS > Беспроводные наушники', 'Беспроводные наушники'); // 2000
    searchCate.set('LGEG > DNS > Наушники Bluetooth', 'Наушники Bluetooth'); // 2000
    searchCate.set('LGEG > DNS > Ушные вкладыши', 'Ушные вкладыши'); // 0
    searchCate.set('LGEG > DNS > Саундбары для тв', 'Саундбары для тв'); // 2
    searchCate.set('LGEG > DNS > Звуковая панель', 'Звуковая панель'); // 218
    searchCate.set('LGEG > DNS > тв саундбар', 'тв саундбар'); // 2
    //searchCate.set('LGEG > DNS > Система объемного звука' , 'Система объемного звука'); // 0 결과없어서 주석처리
    return searchCate;
}


async function parsingItemList(categoryList : Array<string>, detailPage : any, pageNum : number, coltBaseUrlList : Array<ColtBaseUrlItem>) : Promise<void>{
    let rank : number = coltBaseUrlList.length + 1;

    detailPage('div.products-page__content > div.products-page__list  div.catalog-product.ui-button-widget').each((index : number, content : any) => {
        let bsItem : ColtBaseUrlItem = new ColtBaseUrlItem(new ColtShelfItem());
        let bsCate : ColtBaseUrlCate = new ColtBaseUrlCate();
        let bsRank : ColtBaseUrlRank = new ColtBaseUrlRank();
        let parentDiv : any = detailPage(content);
        let url : string = 'https://www.dns-shop.ru' + parentDiv.find('div > a ').attr('href');
        let goodsName : string = parentDiv.find('div > a > span').text();
        let thumbnail : string = parentDiv.find('div.catalog-product__image > a > picture > img').attr('src');
        if (typeof thumbnail == "undefined" || thumbnail == null) {
            thumbnail = '';
        }
        let priceDiv : any = parentDiv.find('div.product-buy__price').text().replaceAll(/\s+/gm, '');
        let priceInfo : Array<any> = priceDiv.split('₽')
        let orgPrice : number = Math.max(priceInfo[0], priceInfo[1]);
        let disPrice : number = Math.min(priceInfo[0], priceInfo[1]);
        if (Object.is(orgPrice, NaN)) orgPrice = 0;
        if (Object.is(disPrice, NaN)) disPrice = 0;

        let avgPoint : string = parentDiv.find('div.catalog-product__stat > a.catalog-product__rating').attr('data-rating');
        let totalEvalutCnt : string = parentDiv.find('div.catalog-product__stat > a.catalog-product__rating').text();
        if (totalEvalutCnt.includes('k')) {
            totalEvalutCnt = totalEvalutCnt.replaceAll(/\D+/gm, '');
            totalEvalutCnt = totalEvalutCnt + '000';
        } else if (totalEvalutCnt.includes('нет отзывов')) {
            totalEvalutCnt = totalEvalutCnt.replaceAll(/\D+/gm, '0');
        }
        let regex : RegExp = /product\/(\w+)/gm;
        let itemNum : string = regex.exec(url)[1];

        makeItem.makeColtBaseUrlItem(bsItem, url, COLLECT_SITE, itemNum)
        makeItem.makeColtBaseCateItem(bsCate, categoryList)
        makeItem.makeColtBaseRankItem(bsRank, rank)
        makeItem.makeColtShelfItem(bsItem, url, COLLECT_SITE, SITE_NAME, goodsName, orgPrice, disPrice, totalEvalutCnt,
            avgPoint, thumbnail, '')

        bsItem.coltBaseUrlCateList.push(bsCate)
        bsItem.coltBaseUrlRank = bsRank;
        coltBaseUrlList.push(bsItem); //

        rank++;
    });
}

export {DnsKeywordList};
