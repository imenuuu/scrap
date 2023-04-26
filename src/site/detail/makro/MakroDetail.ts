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

class MakroDetail implements AcqDetail {

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
                    await page.click('a.product-details-moreless-button.show.text-center');

                    await wait.sleep(3);

                    /*
                    * 팝업창 닫기, 스크롤, 셀렉터 확인 등의 추가작업
                    */
                } catch (e) {
                    logger.error("PAGE goto ERROR  -->    " + e.stack);
                }

                let cItem :ColtItem = new ColtItem();
                const detailPage :any = cheerio.load(await page.content());




                let goodsName :string = detailPage('h1.mak-mb-0.mak-typo__large20.pull-left.js-product-name.capitalize').text();
                let itemNum :string = await this.getItemNum(url, detailPage);

                // goodsName이 파싱되지 않았을경우에 정상적인 item페이지가 아닌걸로 확인하여 makeNotFoundColtItem을 호출한다
                if (!await validator.isNotUndefinedOrEmpty(goodsName)) {
                    await makeItem.makeNotFoundColtItem(cItem, url, this.collectSite, itemNum, detailPage, "33");
                    return cItem;
                }

                let goodsCate :string = await this.getCateInfo(detailPage);
                // 페이지에서 category를 정상적으로 가져온경우 (#M)을 붙여주고 
                // category를 정상적으로 가져오지 못한 경우 NO_CATEGORY로 넣어준다
                if (await validator.isNotUndefinedOrEmpty(goodsCate)) {
                    goodsCate = '(#M)' + goodsCate;
                } else {
                    goodsCate = 'NO_CATEGORY';
                }

                const product_code : string = itemNum

                let brand_name :string = detailPage('div.col-md-4.col-sm-3.no-space > a > u').text();
                let avgPoint : any = parseFloat(detailPage('div.bv_avgRating_component_container.notranslate').text());
                let totalEvalutText : any =detailPage('div.bv_numReviews_text').text();
                let totalEvalutCnt :number= 0;

                if(isNaN(avgPoint)){
                    avgPoint=0
                }

                const match = totalEvalutText.match(/\((\d+)\)/);
                if (match) {
                    totalEvalutCnt=parseInt(match[1])
                }

                let addInfo :string = await this.getAddInfo(product_code ,detailPage);

                let orgPriceText : any = detailPage('div.pdp-CTA-container > div.product-ProductNamePrice > div > p > span.mak-save-price').text(); // 기본가격 기입
                let orgPriceCent : any = detailPage('div.pdp-CTA-container > div.product-ProductNamePrice > div > p > span.mak-product__cents').text();
                let disPriceText : any = detailPage('div.priceData-savings > span.makro-darkgreen > span > span.mak-save-price').text(); // 할인가격 기입
                let disPriceCent : any = detailPage('div.priceData-savings > span.makro-darkgreen > span > span.mak-product__cents').text()

                console.log(orgPriceText)

                let orgPrice : any = 0;
                let disPrice : any = 0;

                let realOrgPrice : number = 0;
                if (isNaN(orgPriceText)){
                    orgPrice = (orgPriceText.replace('R ', ''));
                    orgPrice = parseInt(orgPrice.replace(',', ''))+parseInt(orgPriceCent)/100

                }
                if (isNaN(disPriceText)){
                    disPrice = (disPriceText.replace('R ', ''));
                    disPrice = parseInt(disPrice.replace(',', ''))+parseInt(disPriceCent)/100

                    orgPrice=orgPrice+disPrice
                    disPrice=orgPrice-disPrice

                }
                console.log("realOrgPrice")
                console.log(orgPrice)
                console.log("disPriceText")
                console.log(disPrice)

                // ColtItemIvt에는 할인가가 존재할때는 할인가를 넣어주고 할인가가 없으면 정가를 넣어준다
                let ivtAddPrice :number = orgPrice;

                // 할인가가 따로 존재할 때
                // ColtItemDiscount에 할인가와 할인 비율을 저장
                if (disPrice > 0) {
                    const coltDis :any = new ColtItemDiscount();
                    ivtAddPrice = disPrice;
                    let discountRate :number = Math.round((orgPrice - disPrice) / orgPrice * 100);
                    await makeItem.makeColtItemDisCount(coltDis, disPrice, discountRate)
                    cItem.coltItemDiscountList.push(coltDis);
                }



                // makeColtItem생성
                await makeItem.makeColtItem(cItem, url, this.collectSite, 'Makro', "033", goodsName, itemNum, goodsCate,
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


        try {
            detailPage('div.col-xs-12.mak-select-holder.mak-mb-small.pl-0.pr-0 > div').each((index,content)=>{
                let parentDiv=detailPage(content)
                let option=parentDiv.find('> div.col-sm-5.col-xs-5.mak-padding-xs > label ').text()
                optionList.push(option);

            });

        } catch (error) {
            console.log('getOption Fail');
        }
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

        let soldOut : string = detailPage('div.not-shopable-container').text()

        console.log(soldOut)
        if(soldOut == ' Sold Out'){
            stockOption = 'Out of stock'
        }



        // ColtItemIvt를 생성하여 ColtItem에 추가
        const ivt :ColtItemIvt = new ColtItemIvt();
        await makeItem.makeColtItemIvt(ivt, itemNum, ivtAddPrice, option1, option2, option3, option4, stockOption, stockAmout)
        cItem.coltItemIvtList.push(ivt);
    }

    async getImageAndVideoInfo(detailPage : any, context :any, cItem :ColtItem) {
        let imageList :Array<string> = [];
        let videoList :Array<string> = [];
        try {
            detailPage('div.owl-stage > div').each((index,content)=>{
                let parentDiv=detailPage(content)
                let imgUrl=parentDiv.find('div > div > img.lazyOwl.owl-lazy.mak-responsive-img.mak-hover-img ').attr('src')
                imageList.push(imgUrl.trim());

            });
            console.log(imageList)
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

    async getAddInfo(product_code : string,detailPage :any) :Promise<string>{
        let addinfoObj :Object = new Object();

        addinfoObj['productCode'] = product_code



        detailPage('div.col-xs-12.col-sm-12.mak-content__box-container > table > tbody > tr').each((index,content)=>{
            let parentDiv=detailPage(content)
            let key : string = parentDiv.find('td.attrib.col-xs-12.col-md-4.mak-padding-8.mak-typo__grey').text()
            let value : string = parentDiv.find('td.col-xs-12.col-md-8.mak-padding-8').text()
            addinfoObj[key] = value;

        });


        detailPage('div.row.col-xs-12.col-sm-12 > div.mak-content__box-container > div').each((index,content)=>{
            let parentDiv=detailPage(content)
            let key : string = parentDiv.find('div.col-xs-12.col-md-4.no-space.mak-typo__grey').text()
            let value : string = parentDiv.find('div.col-xs-12.col-md-8.no-space').text()
            addinfoObj[key] = value;
        });

        detailPage('div.pdp-product-details-moretext > div.row.col-xs-12.col-sm-12.col-md-12> div.mak-content__box-container > div.row.mak-bg__light.mak-padding-8 > div').each((index,content)=>{
            let parentDiv=detailPage(content)

            let key: string = parentDiv.find('div.col-xs-12.col-md-4.no-space.mak-typo__grey').text()
            if(key) {
                let value: string = parentDiv.find('div.col-xs-12.col-md-8.no-space').text()

                addinfoObj[key] = value;
            }
        });




        return jsonToStr(addinfoObj);
    }

    async getCateInfo(detailPage :any) :Promise<string> {
        let cateList :Array<string> = [];
        let catelength :number = detailPage('ol.breadcrumb-list > li ').length - 1;
        let goodsName :string = detailPage('h1.mak-mb-0.mak-typo__large20.pull-left.js-product-name.capitalize').text();

        detailPage('ol.breadcrumb > li ').each((index, el) => {
            let cateName :string = '';
            if (index == catelength -1 ) {
                return;
            } else if (index == catelength) {
                cateName = detailPage(el).text();
                cateList.push(cateName);
            } else {
                cateName = detailPage(el).find(' > a').text();
                cateList.push(cateName);
            }
        });

        let goodsCate :string = cateList.join(" > ") + goodsName;

        return goodsCate;
    }

    async getItemNum(url:string, detailPage :any) :Promise<string> {
        /*
        * itemNum 파싱 부분
        *
        * itemNum의 경우 url에 포함되어 있으면 url에서 가져오고
        * url에 포함되어 있지 않다면 페이지에서 파싱해서 가져온다.
        */
        let regex : RegExp = /p\/(\w+)/gm;
        let itemNum:string =regex.exec(url)[1];
        console.log(itemNum)
        return itemNum;
    }
}


export {MakroDetail};
