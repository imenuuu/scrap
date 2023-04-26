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

class ShoppeDetail implements AcqDetail {

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




                    /*
                    * 팝업창 닫기, 스크롤, 셀렉터 확인 등의 추가작업
                    */
                } catch (e) {
                    logger.error("PAGE goto ERROR  -->    " + e.stack);
                }

                let cItem :ColtItem = new ColtItem();
                const detailPage :any = cheerio.load(await page.content());


                let goodsName :string = detailPage(' div.product-briefing.flex.card.s9-a-0 > div.flex.flex-auto.RBf1cu > div > div._44qnta > span').text();
                let itemNum :string = await this.getItemNum(url, detailPage);
                // goodsName이 파싱되지 않았을경우에 정상적인 item페이지가 아닌걸로 확인하여 makeNotFoundColtItem을 호출한다
                if (!await validator.isNotUndefinedOrEmpty(goodsName)) {
                    await makeItem.makeNotFoundColtItem(cItem, url, this.collectSite, itemNum, detailPage, '006');
                    return cItem;
                }
                await page.waitForSelector('div.MTpc1O > div.MZ9yDd > div > div', {timeout: 10000});


                let goodsCate :string = await this.getCateInfo(detailPage);
                // 페이지에서 category를 정상적으로 가져온경우 (#M)을 붙여주고
                // category를 정상적으로 가져오지 못한 경우 NO_CATEGORY로 넣어준다
                if (await validator.isNotUndefinedOrEmpty(goodsCate)) {
                    goodsCate = '(#M)' + goodsCate;
                } else {
                    goodsCate = 'NO_CATEGORY';
                }

                let brand_name :string = detailPage('a.GvvZVe').text();

                let avgPoint : any = parseFloat(detailPage('div._1k47d8._046PXf').text());
                let totalEvalut : any = detailPage('div.flex.X5u-5c > div:nth-child(2) > div._1k47d8').text()
                const regexNotK = /\d+/; // 정규표현식
                if(avgPoint==undefined){
                    avgPoint=='0.0'
                }
                if(totalEvalut==undefined){
                    totalEvalut==0
                }

                if(totalEvalut.match(regexNotK)){
                        totalEvalut = totalEvalut.replace(',','.')
                        totalEvalut = totalEvalut.replace('k','');
                        totalEvalut = parseFloat(totalEvalut) * 1000;
                }

                let totalEvalutCnt :number= parseInt(totalEvalut);
                if(totalEvalutCnt==undefined){
                    totalEvalutCnt=0;
                }

                let addInfo :string = await this.getAddInfo(itemNum,detailPage);


                let disPrice :any = 0;
                let orgPrice :any = detailPage('div.pqTWkA').text().replace('₫','').replace('.','');


                if(detailPage('div.Y3DvsN').text()){
                    orgPrice=detailPage('div.Y3DvsN').text().replace('₫','').replace('.','')


                    disPrice = detailPage('div.pqTWkA').text().replace('₫', '').replace('.','')



                }
                const regex: RegExp = /^(\d+)/;
                orgPrice  = orgPrice.match(regex)[1]
                disPrice  = disPrice.match(regex)[1];


                // ColtItemIvt에는 할인가가 존재할때는 할인가를 넣어주고 할인가가 없으면 정가를 넣어준다
                let ivtAddPrice : any = orgPrice;

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
                await makeItem.makeColtItem(cItem, url, this.collectSite, 'SHOPEE', '006', goodsName, itemNum, goodsCate,
                    brand_name, avgPoint, totalEvalutCnt, addInfo, orgPrice, disPrice);
                await this.getStockInfo(cItem, page, detailPage, ivtAddPrice, itemNum);

                //--image and video--
                await this.getImageAndVideoInfo(detailPage, context, cItem,page);

                // 재고 정보 추가

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
        let option5 :string = '';

        let sizeOptionList :Array<string> = [];

        let stockOption :string = 'In stock';
        let stockAmout :number = -999;


        if(detailPage('button.btn.btn-tinted.btn--l.btn-tinted--disabled.iFo-rx.QA-ylc > span').text()=='thêm vào giỏ hàng') {
            stockOption = 'Out of stock';
        }



        /*
        * optionList에 옵션 가져오기
        */

        try {
            detailPage('div.flex.rY0UiC.j9be9C > div > div:nth-child(1)  > div.flex.items-center.bR6mEk > button').each((index,content)=>{
                let parentDiv=detailPage(content)
                let option=parentDiv.text()
                optionList.push(option);

            });

        } catch (error) {
            console.log('getOption Fail');
        }



        try {
            if(detailPage('div.flex.rY0UiC.j9be9C > div > div:nth-child(2)  > div.flex.items-center.bR6mEk > button')) {
                detailPage('div.flex.rY0UiC.j9be9C > div > div:nth-child(2)  > div.flex.items-center.bR6mEk > button').each((index, content) => {
                    let parentDiv = detailPage(content)
                    let sizeOption = parentDiv.text()
                    sizeOptionList.push(sizeOption);

                });
            }

        } catch (error) {
            console.log('getOption Fail');
        }

        // ColtItem의 옵션 이름들에 상관없이 가져온 순서대로 넣어둔다
        if (optionList&&sizeOptionList.length==0) {
            for (let i = 0; i < optionList.length; i++) {
                option1 = optionList[i];
                cItem.colorOption = option1;
                const ivt :ColtItemIvt = new ColtItemIvt();
                await makeItem.makeColtItemIvt(ivt, itemNum, ivtAddPrice, option1, option2, option3, option4, stockOption, stockAmout)
                cItem.coltItemIvtList.push(ivt);
            }

            // ColtItemIvt를 생성하여 ColtItem에 추가
            const ivt :ColtItemIvt = new ColtItemIvt();
            await makeItem.makeColtItemIvt(ivt, itemNum, ivtAddPrice, option1, option2, option3, option4, stockOption, stockAmout)
            cItem.coltItemIvtList.push(ivt);
        }

        if (sizeOptionList) {
            for (let i = 0; i < optionList.length; i++) {
                for (let j = 0;j < sizeOptionList.length; j++) {
                    option1 = optionList[i];
                    cItem.colorOption = option1;

                    option2 = sizeOptionList[j];
                    cItem.sizeOption = option2;

                    // ColtItemIvt를 생성하여 ColtItem에 추가
                    const ivt :ColtItemIvt = new ColtItemIvt();
                    await makeItem.makeColtItemIvt(ivt, itemNum, ivtAddPrice, option1, option2, option3, option4, stockOption, stockAmout)
                    cItem.coltItemIvtList.push(ivt);

                }
            }


        }

        // stockOption 은 재고있음과 재고없음 둘로 나뉜다(In stock, Out of stock)

    }

    async getImageAndVideoInfo(detailPage : any, context :any, cItem :ColtItem,page : any) {
        let imageList :Array<string> = [];
        let videoList :Array<string> = [];
        await page.click('div.MTpc1O > div:nth-child(1)')
        await wait.sleep(3);
        detailPage  = cheerio.load(await page.content());

        try {

            const videoUrl = detailPage('div.HHru-k > video').attr('src')

            if(videoUrl!=undefined) {
                videoList.push(videoUrl)
            }
            detailPage('div.F8ZVBj > div:nth-child(2)  > div').each((index,content)=>{
                let parentDiv=detailPage(content)
                if(parentDiv.find(' > div.HYyN6J > div.UGfMZF').text().length>0){
                    const divElement = parentDiv.find('> div.O0-58D > div').attr('style');

                    const urlRegex = /url\(["']?([^"']*)["']?\)/;
                    const match = urlRegex.exec(divElement);
                    const videoUrl = match[1];

                    if(videoUrl!=undefined) {
                        videoList.push(videoUrl.trim())
                    }

                }
                else {
                    const divElement = parentDiv.find('> div.O0-58D > div').attr('style');

                    const urlRegex = /url\(["']?([^"']*)["']?\)/;
                    const match = urlRegex.exec(divElement);
                    const imgUrl = match[1];
                    if(imgUrl!=undefined) {
                        imageList.push(imgUrl.trim());
                    }
                }




            });
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

    async getAddInfo(itemNum : any,detailPage :any) :Promise<string>{
        let addinfoObj :Object = new Object();
        addinfoObj['productCode'] = itemNum

        detailPage('div.U9rGd1 > div.MCCLkq > div').each((index,content)=>{
            let parentDiv=detailPage(content)
            let key :string = parentDiv.find('> label').text();
            let value :string = parentDiv.find('> div').text();
            if (validator.isNotUndefinedOrEmpty(key) && validator.isNotUndefinedOrEmpty(value) && key !='Danh Mục') {
                addinfoObj[key] = value;
            }
        });

        return jsonToStr(addinfoObj);
    }

    async getCateInfo(detailPage :any) :Promise<string> {
        let cateList :Array<string> = [];
        let goodsName :string = detailPage('div.flex.items-center.RnKf-X.page-product__breadcrumb > span').text();

        detailPage('div.flex.items-center.RnKf-X.page-product__breadcrumb > a').each((index, content) => {

            let parentDiv=detailPage(content)
            let cateName :string = '';
            cateName = parentDiv.text();
            cateList.push(cateName);

        });

        let goodsCate :string = cateList.join(" > ") + (" > ") + goodsName;

        return goodsCate;
    }

    async getItemNum(url:string, detailPage :any) :Promise<string> {
        const regex = /i\.(\d+)\.(\d+)/;

        const match = url.match(regex);

        let itemNum : string = "";
        if (match) {
            itemNum = match[2];
        } else {
            console.log('상품 코드를 찾을 수 없습니다.');
        }
        return itemNum;
    }
}


export {ShoppeDetail};
