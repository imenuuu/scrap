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

const COLLECT_SITE : string = 'lg.oechsle.pe' // 전달받거나 생성규칙이 존재함
const SITE_NAME : string = 'Oechsle' // 전달받거나 생성규칙이 존재함

class OechsleList implements AcqList {

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
                await page.mouse.wheel({deltaY: 1000});
                await wait.sleep(1)


            } catch (error) {
                if (error instanceof puppeteer.errors.TimeoutError) {
                    logger.error('TimeOut Error!')
                } else {
                    logger.error(error.stack);
                }
            }
            detailPage = cheerio.load(await page.content());

            const str: string = detailPage('span.text.fz-19.text-blue-2').text() // 총 아이템 갯수를 받아오는 부분

            totalCnt = parseInt(str.match(/\d+/)[0], 10);

            totalCnt = totalCnt > 2000 ? 2000 : totalCnt; // 2000개가 Max count

            logger.info('#Category: ' + category.categoryNameList + ', List Total Count: ' + totalCnt);

            if (totalCnt == 0) {
                logger.info('#Empty Result!, cate -> ' + category.categoryNameList + ' , url -> ' + url)
                return coltBaseUrlList;
            }

            let pageSize = 36; // 한 페이지당 아이템의 갯수를 작성

            let pageCnt = Math.floor((totalCnt / pageSize)); // 총갯수/한페이지당 아이템 갯수 = 수집해야할 페이지수
            
            let mod = (totalCnt % pageSize); // 나머지 체크

            if (mod > 0) pageCnt = pageCnt + 1; // 나머지가 있을경우 + 1페이지

            for (let pageNum = 1; pageNum <= pageCnt; pageNum++) {
                if (pageNum > 1) { // 2페이지 이후 수집
                    try {
                        let urlUpdate : string = url+param+pageNum; // URL변경

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
                        await page.mouse.wheel({deltaY: 1000});
                        await wait.sleep(1)

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

    const select = detailPage('div.vitrina.n36colunas > ul > li');
    for(let i=0;i < select.length/2;i++){
        let bsItem : ColtBaseUrlItem = new ColtBaseUrlItem(new ColtShelfItem());

        let bsCate : ColtBaseUrlCate = new ColtBaseUrlCate();

        let bsRank : ColtBaseUrlRank= new ColtBaseUrlRank();
        let indexString : any = 0;
        if(i!=0) {
            indexString = i*2+1;
        }
        else{
            indexString=1;
        }

        const index = indexString.toString();

        let url : string = detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div').attr('data-link'); // 상품의 url정보 기입
        let goodsName : string =  detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div').attr('data-product-name'); // 상품명 기입
        let thumbnail : string = detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div > div.container-image > a > div.product_block.active > div.productImage.prod-img.img_one > img').attr('src'); // 상품이미지 URL 기입

        if (typeof thumbnail == "undefined" || thumbnail == null) {
            // 상품 이미지가 없을경우를 대비해서 예외처리.
            thumbnail = '';
        }

        let orgPrice : any = detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div').attr('data-product-list-price'); // 기본가격 기입
        let disPrice : any = detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div').attr('data-product-price'); // 할인가격 기입
        if (Object.is(orgPrice, NaN)) orgPrice = 0;
        if (Object.is(disPrice, NaN)) disPrice = 0;

        let avgPoint : string = detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div > div.prod-cont.py-10 > div.mt-15 > div:nth-child(4) > div > a > div.bv_averageRating_component_container > div').text(); // 리뷰평점 엘리먼트 주입
        let itemNum : string = detailPage('div.vitrina.n36colunas > ul > li:nth-child('+ index +') > div').attr('data-id');


        //DTO 주입
        makeItem.makeColtBaseUrlItem(bsItem, url, COLLECT_SITE, itemNum)
        makeItem.makeColtBaseCateItem(bsCate, categoryList)
        makeItem.makeColtBaseRankItem(bsRank, rank)
        makeItem.makeColtShelfItem(bsItem, url, COLLECT_SITE, SITE_NAME, goodsName, orgPrice, disPrice, 0,
            avgPoint, thumbnail, '')
        
        // 주입된 DTO를 결과리스트에 저장
        bsItem.coltBaseUrlCateList.push(bsCate)
        bsItem.coltBaseUrlRank = (bsRank);
        coltBaseUrlList.push(bsItem);

        rank++;
    }
}

export {OechsleList};
