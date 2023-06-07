import type {AcqList} from "../AcqList";
import {logger} from "../../../config/logger/Logger";
import {ColtBaseUrlItem} from "../../../dto/ColtBaseUrlItem";
//const { WineItem } = require ("../../../dto/WineItem"); // WineItem 클래스를 import

const service = require('../../../config/service.json');
const puppeteer = require('../../../util/PuppeteerUtil');
const cheerio = require('cheerio');
const wait = require('../../../util/WaitUtil')

class WineItem{
    url: string = '';
    productName : string = '';
    productCountry : string = '';
    productRegion : string = '';
}

class WineList {

    _glbConfig: { [key: string]: any; };
    collectSite: string;

    constructor(config: { [key: string]: any; }, collectSite: string) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.LIST_PUPPET_PROFILE;
        this.collectSite = collectSite;
    }

    async getItemUrls() {

        const [browser, context, page] = await puppeteer.getPage(this._glbConfig)



        let wineItems: WineItem[] = [];
        let detailPage : any
        let currentUrl : string = '';
        let param : string = '?p=';
        let totalCnt : number;
        try {
            let url : string = 'https://www.wine21.com/13_search/wine_list.html';
            try {
                await page.goto(url, {waitUntil: ["domcontentloaded"], timeout: 80000});


                //await page.mouse.wheel({deltaY: 1000});
                // 마우스 스크롤이 필요한 사이트의 경우 사용
            } catch (error) {
                if (error instanceof puppeteer.errors.TimeoutError) {
                    logger.error('TimeOut Error!')
                } else {
                    logger.error(error.stack);
                }
            }
            detailPage = cheerio.load(await page.content());

            totalCnt =20000; // 총 아이템 갯수를 받아오는 부분

            totalCnt = totalCnt > 2000 ? 2000 : totalCnt; // 2000개가 Max count

            logger.info('#Category: ' + ', List Total Count: ' + totalCnt);

            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' +' , url -> ' + url)
                return wineItems;
            }

            let pageSize = 0; // 한 페이지당 아이템의 갯수를 작성

            let pageCnt = Math.floor((totalCnt / pageSize)); // 총갯수/한페이지당 아이템 갯수 = 수집해야할 페이지수

            let mod = (totalCnt % pageSize); // 나머지 체크

            if (mod > 0) pageCnt = pageCnt + 1; // 나머지가 있을경우 + 1페이지

            for (let pageNum = 0; pageNum <= 0; pageNum++) {
                if (pageNum > 1) { // 2페이지 이후 수집
                    try {
                        let urlUpdate : string = ''; // URL변경
                        //ex www.test.com?page=1 ==> www.test.com?page=2

                        await page.goto('https://www.wine21.com/13_search/wine_list.html', {waitUntil: "domcontentloaded"}, {timeout: 30000})
                        // 기다릴 엘리먼트 지정

                        //await page.mouse.wheel({deltaY: 1000});
                        // 마우스 스크롤이 필요하면 주석해제
                        // 필요한만큼 복사해서 사용하세요.
                    } catch (error) {
                        if (error instanceof puppeteer.errors.TimeoutError) {
                            logger.error('TimeOut Error!')
                        } else {
                            logger.error(error.stack);
                        }
                    }

                    let detailPageUpdate = cheerio.load(await page.content());
                    await parsingItemList(detailPageUpdate, pageNum, wineItems);

                } else {
                    // 1페이지 수집
                    console.log("수집중")

                    await parsingItemList(detailPage, pageNum, wineItems);
                }
                await wait.sleep(2);
                logger.info("pageNum: " + pageNum + " , totalList:" + wineItems.length);
            }
        } catch (error) {
            logger.error(error.stack);

        } finally {
            await puppeteer.close(browser, page, this._glbConfig)
        }

    }

}

async function parsingItemList(detailPage: any, pageNum: number, wineItems: WineItem[]) {
    let rank = wineItems.length + 1;
    await wait.sleep(5)
    console.log("수집이 안돼")

    detailPage('div.board-list.board-list-wine > ul:nth-child(2) > li').each((index : number, content) => { // '' 안에 리스트 Element 작성
        let bsItem : WineItem = new WineItem();

        console.log("수집")


        let parentDiv = detailPage(content);
        let urlParse : string = parentDiv.find('div.txt-area  > div.cnt-header > h3 > a').attr('href');
        let productName : string =   parentDiv.find('div.txt-area  > div.cnt-header > h3 > a').text()
        let productCountry : string =  parentDiv.find('span.country').text()
        let productRegion : string = parentDiv.find('span.nation').text()

        const regex = /\((\d+)\)/;
        const match = urlParse.match(regex);

        let url : string = 'https://www.wine21.com/13_search/wine_view.html?Idx='+match[1]+'&lq=LIST'

        bsItem.url = url;
        bsItem.productName = productName;
        bsItem.productCountry = productCountry;
        bsItem.productRegion = productRegion;

        wineItems.push(bsItem)

        rank++;
    });
    console.log(wineItems)
}

export {WineList};
