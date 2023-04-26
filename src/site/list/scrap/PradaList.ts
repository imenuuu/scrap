import {ColtBaseUrlItem} from "../../../dto/ColtBaseUrlItem";
import {ColtBaseUrlCate} from "../../../dto/ColtBaseUrlCate";
import {ColtBaseUrlRank} from "../../../dto/ColtBaseUrlRank";
import {ColtShelfItem} from "../../../dto/ColtShelfItem";
import type {AcqList} from "../AcqList";
import {logger} from "../../../config/logger/Logger";
import type { Category } from "../../../data/Category";

const service = require('../../../config/service.json');
const makeItem = require('../../../util/ItemUtil')
const puppeteer = require('../../../util/PuppeteerUtil');
const cheerio = require('cheerio');
let dateUtils = require('../../../util/DateUtil');
const wait = require('../../../util/WaitUtil')

const COLLECT_SITE : string = '' // 전달받거나 생성규칙이 존재함
const SITE_NAME : string = '' // 전달받거나 생성규칙이 존재함

class PradaList implements AcqList {

    _glbConfig: { [key: string]: any; };
    collectSite: string;

    constructor(config: { [key: string]: any; }, collectSite: string) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.LIST_PUPPET_PROFILE;
        this.collectSite = collectSite;
    }

    async getItemUrls(category : any) {

        const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

        let coltBaseUrlList : ColtBaseUrlItem[] = new Array();
        let detailPage : any
        let currentUrl : string = '';
        let param : string = '?page=';
        let totalCnt : number;
        try {
            let url : string = category.categoryUrl;
            try {
                await page.goto(url, {waitUntil: ["domcontentloaded"], timeout: 80000});
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)
                await page.waitForSelector('div.gridCategory__wrapper > div > div:nth-child(22) > div > div > div > a > div.productQB__imageFront > picture > img', {visible: true}); // ''안에 필요한 selector 삽입

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

            let total = detailPage('span.filter-alt__results').text(); // 총 아이템 갯수를 받아오는 부분

            totalCnt = total.match(/\d+/)?.[0];

            totalCnt = totalCnt > 2000 ? 2000 : totalCnt; // 2000개가 Max count

            logger.info('#Category: ' + category.categoryNameList + ', List Total Count: ' + totalCnt);

            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' + category.categoryNameList + ' , url -> ' + url)
                return coltBaseUrlList;
            }

            let pageSize = 20; // 한 페이지당 아이템의 갯수를 작성

            let pageCnt = Math.floor((totalCnt / pageSize)); // 총갯수/한페이지당 아이템 갯수 = 수집해야할 페이지수

            let mod = (totalCnt % pageSize); // 나머지 체크

            if (mod > 0) pageCnt = pageCnt + 1; // 나머지가 있을경우 + 1페이지

            for (let pageNum = 1; pageNum <= 1; pageNum++) {
                //await page.waitForSelector('div.productQB__imageFront > picture > img', {visible: true}); // ''안에 필요한 selector 삽입

                if (pageNum > 1) { // 2페이지 이후 수집
                    try {
                        let urlUpdate : string = url+param+pageNum; // URL변경
                        //ex www.test.com?page=1 ==> www.test.com?page=2

                        await page.goto(urlUpdate, {waitUntil: "domcontentloaded"}, {timeout: 30000})
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)
                        await page.waitForSelector('div.gridCategory__wrapper > div > div:nth-child(22) > div > div > div > a > div.productQB__imageFront > picture > img', {visible: true}); // ''안에 필요한 selector 삽입
                        // 기다릴 엘리먼트 지정


                        console.log("다 기다림")
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
                    await parsingItemList(category, detailPageUpdate, pageNum, coltBaseUrlList);

                } else {
                    // 1페이지 수집
                    await parsingItemList(category, detailPage, pageNum, coltBaseUrlList);
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

async function parsingItemList(categoryList: any, detailPage: any, pageNum: number, coltBaseUrlList: ColtBaseUrlItem[]) {
    let rank = coltBaseUrlList.length + 1;
    let scrap :Object = new Object();
    console.log('[')

    detailPage('div.gridCategory__wrapper > div > div.grid.grid--1x1 ').each(async (index: number, content) => { // '' 안에 리스트 Element 작성





        let bsItem : ColtBaseUrlItem = new ColtBaseUrlItem(new ColtShelfItem());

        let bsCate : ColtBaseUrlCate = new ColtBaseUrlCate();

        let bsRank : ColtBaseUrlRank= new ColtBaseUrlRank();

        let parentDiv = detailPage(content);


        let url: string = parentDiv.find('> div > div > div.productQB__wrapperOut > a').attr('href'); // 상품의 url정보 기입
        let goodsName: string = parentDiv.find('div.productQB__title').text().trim() // 상품명 기입
        let thumbnail: string = parentDiv.find('picture img').attr('src').replace(/[\s\n]+/g, '') // 이미지 리스트

        scrap['url'] = url;
        scrap['goodsName'] = goodsName;
        scrap['thumbnail'] = thumbnail;

        console.log(JSON.stringify(scrap))

        console.log(',')

        if (typeof thumbnail == "undefined" || thumbnail == null) {
            // 상품 이미지가 없을경우를 대비해서 예외처리.
            thumbnail = '';
        }

        let orgPrice : number = 0; // 기본가격 기입
        let disPrice : number = 0; // 할인가격 기입
        if (Object.is(orgPrice, NaN)) orgPrice = 0;
        if (Object.is(disPrice, NaN)) disPrice = 0;

        let avgPoint : string = ' '; // 리뷰평점 엘리먼트 주입
        let totalEvalutCnt : string = ' ' // 리뷰갯수 엘리먼트 주입
        //let regex : RegExp = /product\/(\w+)/gm;
        let itemNum : string = '';

        //DTO 주입
        makeItem.makeColtBaseUrlItem(bsItem, url, COLLECT_SITE, itemNum)
        makeItem.makeColtBaseCateItem(bsCate, categoryList)
        makeItem.makeColtBaseRankItem(bsRank, rank)
        makeItem.makeColtShelfItem(bsItem, url, COLLECT_SITE, SITE_NAME, goodsName, orgPrice, disPrice, totalEvalutCnt,
            avgPoint, thumbnail, '')

        // 주입된 DTO를 결과리스트에 저장
        bsItem.coltBaseUrlCateList.push(bsCate)
        bsItem.coltBaseUrlRank = (bsRank);
        coltBaseUrlList.push(bsItem);

        rank++;
    });
    console.log(']')
}

export {PradaList};
