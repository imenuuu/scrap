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

const COLLECT_SITE : string = 'lg.makro.co.za' // 전달받거나 생성규칙이 존재함
const SITE_NAME : string = 'Makro' // 전달받거나 생성규칙이 존재함

class MakroList implements AcqList {

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


                if(page('div.page-content-header > h').text()){
                    logger.info('#Not Correct Url ->  + url' + url);
                    return coltBaseUrlList;
                }
                await page.goto(url, {waitUntil: ["networkidle2"], timeout: 80000});

                await page.waitForSelector('div.mak-product-tiles-container__product-tile.bv-product-tile.mak-product-card-inner-wrapper', {visible: true}); // ''안에 필요한 selector 삽입
                await page.waitForSelector('div.mak-product-tiles-container.listview.GRID > div > div > div.col-xs-12.no-space > div > div > div > div > div.bv_averageRating_component_container > div', {visible: true});





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



            let total = detailPage('div.mak-content.mak-plp-list > div > div > div.col-xs-8.visible-xs.visible-sm.mak-content__box-pad-x-reset > h1 > span').text(); // 총 아이템 갯수를 받아오는 부분

            const match = total.match(/\((\d+)\)/);
            if (match) {
                totalCnt=parseInt(match[1])
            }

            console.log(totalCnt)

            totalCnt = totalCnt > 2000 ? 2000 : totalCnt; // 2000개가 Max count

            logger.info('#Category: ' + category.categoryNameList + ', List Total Count: ' + totalCnt);




            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' + category.categoryNameList + ' , url -> ' + url)
                return coltBaseUrlList;
            }

            let pageSize = 20; // 한 페이지당 아이템의 갯수를 작성

            let pageCnt = Math.floor((totalCnt / pageSize)); // 총갯수/한페이지당 아이템 갯수 = 수집해야할 페이지수

            let mod = (totalCnt % pageSize); // 나머지 체크
            console.log(mod)

            if (mod > 0) pageCnt = pageCnt + 1; // 나머지가 있을경우 + 1페이지

            for (let pageNum = 0; pageNum <= pageCnt-1; pageNum++) {
                if (pageNum > 0) { // 2페이지 이후 수집
                    try {

                        let urlUpdate : string = url + param + pageNum +'&q=%3Arelevance' ; // URL변경
                        //ex www.test.com?page=1 ==> www.test.com?page=2
                        await page.mouse.wheel({deltaY: 1000});
                        await page.mouse.wheel({deltaY: 1000});
                        await page.mouse.wheel({deltaY: 1000});
                        await page.goto(urlUpdate, {waitUntil: "networkidle2"}, {timeout: 30000})
                        await page.waitForSelector('div.mak-product-tiles-container__product-tile.bv-product-tile.mak-product-card-inner-wrapper', {visible: true}); // ''안에 필요한 selector 삽입
                        await page.waitForSelector('div.mak-product-tiles-container.listview.GRID > div > div > div.col-xs-12.no-space > div > div > div > div > div.bv_averageRating_component_container > div', {visible: true});
                        await page.waitForSelector('div.mak-product-tiles-container.listview.GRID > div > a > img', {visible: true}, {timeout: 15000}); // ''안에 필요한 selector 삽입

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

    detailPage('div.mak-product-tiles-container.listview.GRID > div').each((index : number, content) => { // '' 안에 리스트 Element 작성
        let bsItem : ColtBaseUrlItem = new ColtBaseUrlItem(new ColtShelfItem());

        let bsCate : ColtBaseUrlCate = new ColtBaseUrlCate();

        let bsRank : ColtBaseUrlRank= new ColtBaseUrlRank();

        let parentDiv = detailPage(content);

        let url : string = 'https://www.makro.co.za' + parentDiv.find('> a').attr('href'); // 상품의 url정보 기입
        let goodsName : string =  parentDiv.find('div > a > span').text()// 상품명 기입
        let thumbnail : string =  parentDiv.find('> a > img').attr('src') // 상품이미지 URL 기입

        /*
        console.log(url)
        console.log(goodsName)

         */





        if (typeof thumbnail == "undefined" || thumbnail == null) {
            // 상품 이미지가 없을경우를 대비해서 예외처리.
            let thumbnailData  : string =  parentDiv.find('> a > img').attr('data-src')
            if(thumbnailData){
                thumbnail=thumbnailData;
            }
            else {
                thumbnail = '';
            }
        }


        let orgPriceText : any = parentDiv.find('> div > p > span.mak-save-price').text(); // 기본가격 기입
        let orgPriceCent : any = parentDiv.find('> div > p > span.mak-product__cents').text();

        let disPriceText : any = parentDiv.find('> div > div.col-xs-12.saving > span.mak-save-price').text(); // 할인가격 기입
        let disPriceCent : any = parentDiv.find('> div > div.col-xs-12.saving > span.mak-product__cents').text()




        let orgPrice : any = 0;
        let disPrice : any = 0;

        if (isNaN(orgPriceText)){
            orgPrice = (orgPriceText.replace('R ', ''));
            orgPrice = parseInt(orgPrice.replace(',', ''))+parseInt(orgPriceCent)/100


        }
        if (isNaN(disPriceText)){
            disPrice = (disPriceText.replace('R ', ''));
            disPrice = parseInt(disPrice.replace(',', ''))+parseInt(disPriceCent)/100
            orgPrice=orgPrice+disPrice
            disPrice=orgPrice


        }














        let avgPoint : string = parentDiv.find('> div > div.col-xs-12.no-space > div > div > div > div > div.bv_averageRating_component_container > div').text(); // 리뷰평점 엘리먼트 주입
        let totalEvalutCnt : string = parentDiv.find('> div > div.col-xs-12.no-space > div > div > div > div > div.bv_numReviews_component_container > div.bv_text').text(); // 리뷰갯수 엘리먼트 주입
        let regex : RegExp = /p\/(\w+)/gm;
        let itemNum : string = regex.exec(url)[1];

        const match = totalEvalutCnt.match(/\((\d+)\)/);
        if (match) {
            totalEvalutCnt=match[1]
        }

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
}

export {MakroList};
