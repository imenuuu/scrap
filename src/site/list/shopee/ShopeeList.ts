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

const COLLECT_SITE : string = 'lg.shopee.vn' // 전달받거나 생성규칙이 존재함
const SITE_NAME : string = 'SHOPEE' // 전달받거나 생성규칙이 존재함

class ShopeeList implements AcqList {

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
        let totalPage : number;
        let currentPage : number;

        try {
            let url : string = category.categoryUrl;
            try {
                await page.goto(url, {waitUntil: ["domcontentloaded"], timeout: 80000});

                await page.waitForSelector(' div.row.shopee-search-item-result__items > div:nth-child(1) > a > div > div > div:nth-child(1) > div > img', {visible: true}); // ''안에 필요한 selector 삽입


                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(3)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(3)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(3)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(3)
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(3)


            } catch (error) {
                if (error instanceof puppeteer.errors.TimeoutError) {
                    logger.error('TimeOut Error!')
                } else {
                    logger.error(error.stack);
                }
            }
            detailPage = cheerio.load(await page.content());

            totalPage= parseInt(detailPage('span.shopee-mini-page-controller__total').text())
            currentPage = parseInt(detailPage('span.shopee-mini-page-controller__total').text())



            /*

            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' + category.categoryNameList + ' , url -> ' + url)
                return coltBaseUrlList;
            }

             */

            //let pageSize = 0; // 한 페이지당 아이템의 갯수를 작성

            let pageCnt = totalPage // 총갯수/한페이지당 아이템 갯수 = 수집해야할 페이지수
            url=url.replace(/&?page=0&/, '')+'&';



                if (totalPage>currentPage) pageCnt = pageCnt + 1; // 나머지가 있을경우 + 1페이지pageCnt-1

            for (let pageNum = 0; pageNum <=pageCnt; pageNum++) {
                if (pageNum > 0) { // 2페이지 이후 수집
                    try {
                        let urlUpdate : string = url+param+pageNum; // URL변경
                        //ex www.test.com?page=1 ==> www.test.com?page=2

                        await page.goto(urlUpdate, {waitUntil: "domcontentloaded"}, {timeout: 30000})

                        await page.waitForSelector('div.container.iFOymg > div.doAEtb > div > div.row.shopee-search-item-result__items > div:nth-child(1) > a > div > div > div:nth-child(1) > div > img', {visible: true}); // ''안에 필요한 selector 삽입

                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(3)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(3)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(3)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(3)
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(3)



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
                    await parsingItemList(category, detailPage, pageNum, coltBaseUrlList);
                }
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

    detailPage('div.row.shopee-search-item-result__items > div').each((index : number, content) => { // '' 안에 리스트 Element 작성
        wait.sleep(10)

        let bsItem : ColtBaseUrlItem = new ColtBaseUrlItem(new ColtShelfItem());

        let bsCate : ColtBaseUrlCate = new ColtBaseUrlCate();

        let bsRank : ColtBaseUrlRank= new ColtBaseUrlRank();

        let parentDiv = detailPage(content);

        let url : string = 'https://shopee.vn'+parentDiv.find('> a').attr('href'); // 상품의 url정보 기입

        let goodsName : string =  parentDiv.find('> a > div > div > div.ScPA3O > div.klCFph > div.MZeqgw > div').text() // 상품명 기입
        let thumbnail : string = parentDiv.find('> a > div > div > div:nth-child(1) > div > img').attr('src') // 상품이미지 URL 기입

        if (typeof thumbnail == "undefined" || thumbnail == null) {
            // 상품 이미지가 없을경우를 대비해서 예외처리.
            thumbnail = '';
        }

        let disPrice : any = 0
        let orgPrice : any = parentDiv.find('div.AQ4KLF > div.cbl0HO.MUmBjS > span:nth-child(2)').text().replace('.',''); // 기본가격 기입
        if(parentDiv.find('div.AQ4KLF > div.cbl0HO._90eCxb.It3cSY').text()){
            disPrice = orgPrice.replace('.','');
            orgPrice = parentDiv.find('div.AQ4KLF > div.cbl0HO._90eCxb.It3cSY').text().slice(1).replace('.',''); // 할인가격 기입
        }


        if (Object.is(orgPrice, NaN)) orgPrice = 0;
        if (Object.is(disPrice, NaN)) disPrice = 0;




        let avgSumPoint: any = 0;
        parentDiv.find('div.shopee-rating-stars__stars > div').each((index,content)=>{
            let parentDiv=detailPage(content)
            let point : any=0;
            point=parseFloat(parentDiv.find('> div.shopee-rating-stars__lit').css('width').replace(/%/g,""));
            avgSumPoint =  avgSumPoint + point

        });
        let avgPoint : any = avgSumPoint/100; // 리뷰평점 엘리먼트 주입

        avgPoint = avgPoint.toFixed(1)
        let totalEvalut : any = ""

        /*
        let totalEvalut : any =parentDiv.find('div.ScPA3O > div.tysB0L > div.x\\+3B8m.wOebCz').text()

        if(totalEvalut.match(regexCnt)){
            totalEvalut=totalEvalut.match(regexCnt)?.[0];
            totalEvalut = totalEvalut.replace(',','.')
            totalEvalut = totalEvalut.replace('k','');
            totalEvalut = parseFloat(totalEvalut) * 1000;


        }
        else{
            totalEvalut=totalEvalut.match(regexNotK)?.[0];
        }

         */


        let totalEvalutCnt : number =  0// 리뷰갯수 엘리먼트 주입



        const regex = /i\.(\d+)\.(\d+)/;

        const match = url.match(regex);

        let itemNum : string = "";
        if (match) {
            itemNum = match[2];
        } else {
            console.log('상품 코드를 찾을 수 없습니다.');
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


export {ShopeeList};
