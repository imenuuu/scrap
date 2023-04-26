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

                let brand_name :string = detailPage('div.row.align-items-center > div.col-6.pdp-text-brand > h2 > div > a').text();
                let avgPoint : number = detailPage('section.mt-20.d-block.d-lg-none > #rating_bv > div > div > button > div.bv_avgRating_component_container.notranslate').text();

                let totalEvalutCnt :number= parseInt(detailPage('section.mt-20.d-block.d-lg-none > #rating_bv > div > div > button > div.bv_numReviews_component_container > div').text().replace(/\D/g,''));

                console.log(totalEvalutCnt)


                let addInfo :string = await this.getAddInfo(detailPage,itemNum);

                let orgPrice :any = ''
                let disPrice :any = ''
                let ivtAddPrice :number = 0;
                if(detailPage('div.row.before-price')){
                    orgPrice  = detailPage('div.row.before-price > div.col-7.text-right > span.text.text-gray-light.text-del.hideLine').text().replace("S/","").replace(" ","");
                    disPrice = detailPage('div.col-7.d-flex.align-items-center.justify-content-end > span.text.fz-17.text-brown.fw-bold').text().replace("S/","").replace(" ","");
                    const coltDis : ColtItemDiscount = new ColtItemDiscount();
                    let discountRate :number = detailPage('div.col-7.d-flex.align-items-center.justify-content-end > span.flag-of.ml-10').text().replace("-","").replace("%","");
                    await makeItem.makeColtItemDisCount(coltDis, disPrice, discountRate)
                    cItem.coltItemDiscountList.push(coltDis);
                    ivtAddPrice = disPrice
                }
                else{
                    orgPrice = detailPage('div.col-7.d-flex.align-items-center.justify-content-end > span.text.fz-17.text-brown.fw-bold').text().replace("S/","").replace(" ","");
                    disPrice=0;
                    ivtAddPrice = orgPrice;
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

        let sizeOptionList :Array<string> = [];


        let stockOption :string = 'In stock';
        let stockAmout :number = -999;

        if(detailPage('div.container-pdp > section > div:nth-child(2) > div.d-lg-flex.d-none.mb-25.mt-25 > div.col.pr-0 > button').text()=="Elige color y talla")
            stockOption = 'Out of stock';

        try {
            detailPage('div.sku-selector-container.sku-selector-container-0 > ul:nth-child(1) > li > span > input').each((index,content)=>{
                let parentDiv=detailPage(content)
                let option=parentDiv.attr('value')
                optionList.push(option);

            });

        } catch (error) {
            console.log('getOption Fail');
        }



        try {
            detailPage('div.sku-selector-container.sku-selector-container-0 > ul:nth-child(2) > li > span > input').each((index, content) => {
                let parentDiv = detailPage(content)
                let sizeOption = parentDiv.attr('value')
                sizeOptionList.push(sizeOption);

            });

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

    }

    async getImageAndVideoInfo(detailPage : any, context :any, cItem :ColtItem) {
        let imageList :Array<string> = [];
        let videoList :Array<string> = [];
        try {

            detailPage('ul.thumbs > li').each((index,content)=>{
                let parentDiv=detailPage(content)
                const imgSelect=parentDiv.find('> a').attr('rel')
                if(imgSelect==null){
                    const videoUrl = parentDiv.find('> a > div > meta:nth-child(4)').attr('content');
                    videoList.push(videoUrl)

                }
                else {
                    const imgUrl = parentDiv.find('> a > img').attr('src')
                    imageList.push(imgUrl)
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

    async getAddInfo(detailPage: any, itemNum: string) :Promise<string>{
        let addinfoObj :Object = new Object();
        addinfoObj['productCode'] = itemNum

        detailPage('table.group.Ficha-Tecnica.table.-striped.text.fz-15 > tbody > tr').each((index,content)=>{
            let parentDiv=detailPage(content)
            let key :string = parentDiv.find('> th > h2').text();
            let value :string = parentDiv.find('> td').text();
            if (validator.isNotUndefinedOrEmpty(key) && validator.isNotUndefinedOrEmpty(value) && key !='Danh Mục') {
                addinfoObj[key] = value;
            }
        });

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

        return cateList.join(" > ") + (" > ") + goodsName;
    }

    async getItemNum(url:string, detailPage :any) :Promise<string> {
        return detailPage('div.container.pdp-module-right > div.mt-20.d-none.d-lg-block > div.row.align-items-center > div.col-6.text-right > div.pdp-text-sku > div.skuReference').text();
    }
}


export {OechsleDetail};
