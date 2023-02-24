import {ColtBaseUrlItem} from "../../../dto/ColtBaseUrlItem";
import {ColtBaseUrlCate} from "../../../dto/ColtBaseUrlCate";
import {ColtBaseUrlRank} from "../../../dto/ColtBaseUrlRank";
import {ColtShelfItem} from "../../../dto/ColtShelfItem";
import type {List} from "../List";

const logger = require('../../../config/logger/Logger');
const service = require('../../../config/service.json');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
let dateUtils = require('../../../util/Dateutil');

let stdt;

const COLLECT_SITE = 'lg.dns-shop.ru'
const SITE_NAME = 'DNS'

class DnsKeywordList implements List {

    _glbConfig: { [key: string]: any; };
    collectSite: string;
    luminati_zone: string;
    OXYLABS: boolean;
    LUMINATI: boolean;
    cnt: number;

    constructor(config, collectSite, cnt) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.LIST_PUPPET_PROFILE;
        this.collectSite = collectSite;
        this.OXYLABS = service.OXYLABS;
        this.LUMINATI = service.LUMINATI;
        this.luminati_zone = 'lum-customer-epopcon-zone-zone_ru';
        this.cnt = cnt;
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

    async getItemUrls(categoryList) {

        stdt = await getTurn();

        const browser = await puppeteer.launch(this._glbConfig);
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        await pageSet(page);

        let coltBaseUrlList = new Array();
        let detailPage
        let currentUrl = '';
        let param = '?p=';
        let totalCnt;
        try {
            let url = categoryList.cateUrl;
            try {
                await page.goto(url, {waitUntil: ["domcontentloaded"], timeout: 60000});
                await page.waitForSelector('body > div.container.category-child > div > div.products-page__content > div.products-page__list > div.products-list > div > div > div > div.catalog-product__image > a > picture > img', {visible: true});
                await page.waitForSelector('div.product-buy__price', {timeout: 30000});
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
            if (categoryList.name.includes('LGEG')) {
                currentUrl = await page.url();
                if (currentUrl.includes('?')) param = '&p=';
                totalCnt = detailPage('span.products-count')//.text().replaceAll(/\d+ категориях/gm, '').replaceAll(/\d+ категории/gm, '').replaceAll(/\D+/gm, '');
            } else {
                totalCnt = detailPage('div.products-page__title').text().replaceAll(/\d+ категориях/gm, '').replaceAll(/\d+ категории/gm, '').replaceAll(/\D+/gm, '');
                currentUrl = categoryList.cateUrl;
            }

            totalCnt = totalCnt > 2000 ? 2000 : totalCnt;
            logger.info('#Category: ' + categoryList.name + ', List Total Count: ' + totalCnt);
            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' + categoryList.name + ' , url -> ' + url)
                return coltBaseUrlList;
            }

            let pageSize = 18;
            let pageCnt = Math.floor((totalCnt / pageSize));
            let mod = (totalCnt % pageSize);
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

                    let detailPageUpdate = cheerio.load(await page.content());
                    parsingItemList(categoryList, detailPageUpdate, pageNum, coltBaseUrlList);

                } else {
                    parsingItemList(categoryList, detailPage, pageNum, coltBaseUrlList);
                }
                await sleep(2);
                logger.info("pageNum: " + pageNum + " , totalList:" + coltBaseUrlList.length);
            }
        } catch (error) {
            logger.error(error.stack);

        } finally {
            //global.args.pop();
            await page.close()
            await browser.close();

        }

        return coltBaseUrlList;
    }

}
async function sleep(sec) {
    sec = sec * 1000
    return new Promise((resolve) => {
        setTimeout(resolve, sec);
    })
}

async function getTurn() {
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

async function getTraverseCate() {
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


async function getSearchCate() {
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

async function pageSet(page) {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false
        })
    });

    // 루미나티
    await page.setDefaultTimeout(50000000);
    await page.authenticate({
        username: 'lum-customer-epopcon-zone-zone_ru',
        password: 'jhwfsy8ucuh2'
    })
    await page.setDefaultNavigationTimeout(70000);
    await page.setDefaultTimeout(70000);
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36");
}


async function parsingItemList(categoryList, detailPage, pageNum, coltBaseUrlList) {
    let rank = coltBaseUrlList.length + 1;

    detailPage('div.products-page__content > div.products-page__list  div.catalog-product.ui-button-widget').each((index, content) => {
        let bsItem = new ColtBaseUrlItem(new ColtShelfItem());
        let bsCate = new ColtBaseUrlCate();
        let bsRank = new ColtBaseUrlRank();
        let parentDiv = detailPage(content);
        let url = 'https://www.dns-shop.ru' + parentDiv.find('div > a ').attr('href');
        let goodsName = parentDiv.find('div > a > span').text();
        let thumbnail = parentDiv.find('div.catalog-product__image > a > picture > img').attr('src');
        if (typeof thumbnail == "undefined" || thumbnail == null) {
            thumbnail = '';
        }
        let priceDiv = parentDiv.find('div.product-buy__price').text().replaceAll(/\s+/gm, '');
        let priceInfo = priceDiv.split('₽')
        let orgPrice = Math.max(priceInfo[0], priceInfo[1]);
        let disPrice = Math.min(priceInfo[0], priceInfo[1]);
        if (Object.is(orgPrice, NaN)) orgPrice = 0;
        if (Object.is(disPrice, NaN)) disPrice = 0;

        let avgPoint = parentDiv.find('div.catalog-product__stat > a.catalog-product__rating').attr('data-rating');
        let totalEvalutCnt = parentDiv.find('div.catalog-product__stat > a.catalog-product__rating').text();
        if (totalEvalutCnt.includes('k')) {
            totalEvalutCnt = totalEvalutCnt.replaceAll(/\D+/gm, '');
            totalEvalutCnt = totalEvalutCnt + '000';
        } else if (totalEvalutCnt.includes('нет отзывов')) {
            totalEvalutCnt = totalEvalutCnt.replaceAll(/\D+/gm, '0');
        }
        let regex = /product\/(\w+)/gm;
        let itemNum = regex.exec(url)[1];
        bsItem.itemNum = itemNum;
        bsItem.url = url;
        bsItem.type = 'M';
        bsItem.newYn = stdt;
        bsItem.collectSite = COLLECT_SITE;
        //bsItem.regDt = dateUtils.currentDate();
        bsItem.uptDt = dateUtils.currentDate();
        bsItem.collectDate = dateUtils.currentDay();
        //bsItem.expiredDt = dateUtils.expiredDt();

        bsCate.cate = categoryList.name;
        bsCate.cateUrl = categoryList.cateUrl;
        bsCate.regDt = dateUtils.currentDate();
        bsItem.coltBaseUrlCateList.push(bsCate)

        bsRank.rank = rank;
        bsRank.regDt = dateUtils.currentDate();
        bsItem.coltBaseUrlRank.push(bsRank);

        bsItem.coltShelfItem.goodsName = goodsName;
        bsItem.coltShelfItem.collectSite = COLLECT_SITE;
        bsItem.coltShelfItem.collectUrl = url;
        bsItem.coltShelfItem.siteName = SITE_NAME;
        bsItem.coltShelfItem.price = orgPrice;
        bsItem.coltShelfItem.discountPrice = disPrice;
        bsItem.coltShelfItem.totalEvalut = totalEvalutCnt;
        bsItem.coltShelfItem.avgPoint = avgPoint;
        bsItem.coltShelfItem.seller = '';
        bsItem.coltShelfItem.thumbnail = thumbnail;
        bsItem.coltShelfItem.addInfo = '';
        bsItem.coltShelfItem.regDt = dateUtils.currentDate();
        bsItem.coltShelfItem.uptDt = dateUtils.currentDate();

        coltBaseUrlList.push(bsItem);

        rank++;
    });
}

export {DnsKeywordList};
