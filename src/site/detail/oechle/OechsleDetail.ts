import {ColtItem} from "../../../dto/ColtItem";
import {ColtImage} from "../../../dto/ColtImage";
import {ColtItemDiscount} from "../../../dto/ColtItemDiscount";
import {ColtItemIvt} from "../../../dto/ColtItemIvt";
import type {AcqDetail} from "../AcqDetail";
import {logger} from "../../../config/logger/Logger";


const cheerio = require('cheerio');
const hash = require('../../../util/HashUtil');
const {jsonToStr, strToJson} = require('../../../util/Jsonutil');
const service = require('../../../config/service.json');
const wait = require('../../../util/WaitUtil')
const makeItem = require('../../../util/ItemUtil')
const puppeteer = require('../../../util/PuppeteerUtil')
const validator = require('../../../util/ValidatorUtil')

class OechsleDetail implements AcqDetail {

    _glbConfig: { [key: string]: any; };
    collectSite: string;

    constructor(config: { [key: string]: any; }, collectSite: string) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        this.collectSite = collectSite;
    }

    async extractItemDetail(url:string): Promise<ColtItem> {
        try {

            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                try {
                    //URL로 페이지 진입
                    await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000});
                    await wait.sleep(3);
                } catch (e) {
                    logger.error("PAGE goto ERROR  -->    " + e.stack);
                }               

                console.log("페이지 로딩완료")
                let cItem :ColtItem = new ColtItem();
                const detailPage :any = cheerio.load(await page.content());

                let goodsName :string = detailPage('h1.mt-10 > div').text();
                let itemNum :string = await this.getItemNum(url, detailPage);
                if (!await validator.isNotUndefinedOrEmpty(goodsName)) {
                    await makeItem.makeNotFoundColtItem(cItem, url, this.collectSite, itemNum, detailPage, itemNum);
                    return cItem;
                }

                let goodsCate :string = await this.getCateInfo(detailPage);
                if (await validator.isNotUndefinedOrEmpty(goodsCate)) {
                    goodsCate = '(#M)' + goodsCate;
                } else {
                    goodsCate = 'NO_CATEGORY';
                }

                let brand_name :string = detailPage('div.row.align-items-center > div.col-6.pdp-text-brand > h2 > div > a > font > font').text();
                let avgPoint :number = 0;
                let totalEvalutCnt :number= 0;
                let addInfo :string = await this.getAddInfo(detailPage);

                let orgPrice :number = 0;
                let disPrice :number = 0;
                // ColtItemIvt에는 할인가가 존재할때는 할인가를 넣어주고 할인가가 없으면 정가를 넣어준다
                let ivtAddPrice :number = orgPrice;

                // 할인가가 따로 존재할 때
                // ColtItemDiscount에 할인가와 할인 비율을 저장
                if (disPrice > 0) {
                    const coltDis : ColtItemDiscount = new ColtItemDiscount();
                    let discountRate :number = Math.round((orgPrice - disPrice) / orgPrice * 100);
                    await makeItem.makeColtItemDisCount(coltDis, disPrice, discountRate)
                    cItem.coltItemDiscountList.push(coltDis);
                    // ivtAddPrice에 할인가 저장
                    ivtAddPrice = disPrice;
                }

                // makeColtItem생성
                await makeItem.makeColtItem(cItem, url, this.collectSite, 'Oechsle', '022', goodsName, itemNum, goodsCate,
                    brand_name, avgPoint, totalEvalutCnt, addInfo, orgPrice, disPrice);

                //--image and video--
                await this.getImageAndVideoInfo(detailPage, context, cItem);

                // 재고 정보 추가
                await this.getStockInfo(cItem, page, detailPage, ivtAddPrice, itemNum);
                return cItem;
            } catch (error) {
                logger.error(error.stack);
            } finally {
                await puppeteer.close(browser, page, this._glbConfig)
            }
        } catch (e) {
            logger.error(e.stack);
        }
    }


    // 옵션 및 재고를 추가하는 함수
    async getStockInfo(cItem :ColtItem, page :any, detailPage :any, ivtAddPrice:number, itemNum :string) {
        //옵션설정
        let optionList :Array<string> = [];
        let option1 :string = '';
        let option2 :string = '';
        let option3 :string = '';
        let option4 :string = '';

        /*
        * optionList에 옵션 가져오기
        */

        // ColtItem의 옵션 이름들에 상관없이 가져온 순서대로 넣어둔다
        if (optionList) {
            for (let i = 0; i < optionList.length; i++) {
                switch (i) {
                    case 0:
                        option1 = optionList[i];
                        cItem.colorOption = option1;
                        break;
                    case 1:
                        option2 = optionList[i];
                        cItem.sizeOption = option2;
                        break;
                    case 2:
                        option3 = optionList[i];
                        cItem.styleOption = option3;
                        break;
                    case 3:
                        option4 = optionList[i];
                        cItem.giftOption = option4;
                        break;
                }
            }
        }

        // stockOption 은 재고있음과 재고없음 둘로 나뉜다(In stock, Out of stock)
        let stockOption :string = 'In stock';
        let stockAmout :number = -999;

        if('재고 없음의 조건')
            stockOption = 'Out of stock';

        // ColtItemIvt를 생성하여 ColtItem에 추가
        const ivt :ColtItemIvt = new ColtItemIvt();
        await makeItem.makeColtItemIvt(ivt, itemNum, ivtAddPrice, option1, option2, option3, option4, stockOption, stockAmout)
        cItem.coltItemIvtList.push(ivt);
    }

    async getImageAndVideoInfo(detailPage : any, context :any, cItem :ColtItem) {
        let imageList :Array<string> = [];
        let videoList :Array<string> = [];
        try {
            /*
            * imageUrl, videoUrl을 가져온다
            */
        } catch (error) {
            console.log('getImageAndVideoInfo Fail');
        }
        // 가져온 미디어 url들을 coltImage 데이터로 만들어서 cItem에 추가한다
        imageList.map((image) => {
            const coltImage :ColtImage = new ColtImage();
            coltImage.goodsImage = image;
            coltImage.hash = hash.toHash(image);
            cItem.coltImageList.push(coltImage);
        });

        videoList.map((video) => {
            const coltImage :ColtImage = new ColtImage();
            coltImage.goodsImage = video;
            coltImage.hash = hash.toHash(video);
            cItem.coltImageList.push(coltImage);
        });
        
    }

    async getAddInfo(detailPage :any) :Promise<string>{
        let addinfoObj :Object = new Object();
        let infoList :Array<any> = detailPage("addInfo 목록 파싱부분")
        for (let info of Array.from(infoList)) {
            let key :string = '';
            let value :string = '';
            if (validator.isNotUndefinedOrEmpty(key) && validator.isNotUndefinedOrEmpty(value)) {
                addinfoObj[key] = value;
            }
        }
        return jsonToStr(addinfoObj);
    }

    async getCateInfo(detailPage :any) :Promise<string> {
        let cateList :Array<string> = [];
        let goodsName :string = detailPage('h1.mt-10 > div').text();

        detailPage('section.breadcrumb.breadcrumb-oe > ul > li').each((index, content) => {

            let parentDiv=detailPage(content)
            let cateName :string = '';
            cateName = parentDiv.find('> a > span').text();
            cateList.push(cateName);

        });

        let goodsCate :string = cateList.join(" > ") + (" > ") + goodsName;

        return goodsCate;
    }

    async getItemNum(url:string, detailPage :any) :Promise<string> {
        return detailPage('div.row.align-items-center > div.col-6.text-right > div > div').text();
    }
}


export {OechsleDetail};
