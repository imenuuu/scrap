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

let global

class DnsDetail implements AcqDetail {
    _glbConfig: { [key: string]: any; };
    collectSite: string;
    cnt: number;

    constructor(config, collectSite, cnt) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        global = this._glbConfig
        this.collectSite = collectSite;
        this.cnt = cnt;
    }

    async extractItemDetail(url): Promise<ColtItem> {
        try {

            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                try {
                    await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000});
                    await wait.sleep(5);
                    await page.waitForSelector('h1.product-card-top__title', {timeout: 10000});
                    await page.waitForSelector('div.product-card-top__code', {timeout: 10000});
                    await page.waitForSelector('button.button-ui.button-ui_white.product-characteristics__expand', {timeout: 10000});
                    await page.waitForSelector('div.product-card-top.product-card-top_full > div.product-card-top__buy > div.product-buy.product-buy_one-line > div >div.product-buy__price', {timeout: 10000});
                    await page.click('button.button-ui.button-ui_white.product-characteristics__expand');
                    await page.waitForSelector('div.product-card-top__buy > div.product-buy > button.button-ui.buy-btn', {timeout: 20000});
                } catch (e) {
                    logger.error(e.message);
                    // await page.waitForSelector('span.product-card-top__avails.avails-container.avails-container_tile', {timeout: 10000});
                    // await page.waitForSelector('div.order-avail-wrap.order-avail-wrap_not-avail', {timeout: 10000});
                    await wait.sleep(2);
                }
                await wait.sleep(5);


                let cItem = new ColtItem();
                const detailPage = cheerio.load(await page.content());

                const title = detailPage('h1.product-card-top__title').text();
                const item_num = await this.getItemNum(url);
                if (!await validator.isNotUndefinedOrEmpty(title)) {
                    await makeItem.makeNotFoundColtItem(cItem, url, this.collectSite, item_num, detailPage, '17');
                    return cItem;
                }
                logger.info('ITEM_NUM: ' + item_num + ' TITLE:' + title);

                let category = await this.getCateInfo(detailPage);
                if (await validator.isNotUndefinedOrEmpty(category)) {
                    category = '(#M)' + category;
                } else {
                    category = 'NO_CATEGORY';
                }

                const product_code = detailPage('div.product-card-top__code').text().replaceAll(/\D+/gm, '');
                let brand_name = detailPage('a.product-card-top__brand > img').attr('alt');
                let avgPoint = detailPage('div.product-card-top__stat > a.product-card-top__rating').attr('data-rating');
                if (avgPoint == '0') avgPoint = '0.0';
                if (!await validator.isNotUndefinedOrEmpty(avgPoint)) avgPoint = '0.0';
                let totalEvalutCnt = await this.getTotalEvalutCnt(detailPage);
                let addInfo = await this.getAddInfo(detailPage, product_code);


                //--price--
                let priceDiv = detailPage('div.product-card-top.product-card-top_full > div.product-card-top__buy > div.product-buy.product-buy_one-line > div >div.product-buy__price').text().replaceAll(/\s/gm, '');
                let priceInfo = priceDiv.split('₽');
                let orgPrice = Math.max(priceInfo[0], priceInfo[1]);
                let disPrice = Math.min(priceInfo[0], priceInfo[1]);
                if (Object.is(orgPrice, NaN)) orgPrice = 0;
                if (Object.is(disPrice, NaN)) disPrice = 0;
                let ivtAddPrice = orgPrice;

                if (disPrice > 0) {
                    const coltDis = new ColtItemDiscount();
                    ivtAddPrice = disPrice;
                    let discountRate = Math.round((orgPrice - disPrice) / orgPrice * 100);
                    await makeItem.makeColtItemDisCount(coltDis, disPrice, discountRate)
                    cItem.coltItemDiscountList.push(coltDis);
                }

                await makeItem.makeColtItem(cItem, url, this.collectSite, 'Dns', '017', title, item_num, category,
                    brand_name, avgPoint, totalEvalutCnt, addInfo, orgPrice, disPrice);
                //--option--
                let optionList = await this.getOptionInfo(detailPage);

                //--image and video--
                let imageList = [];
                try {
                    imageList = await this.getImageAndVideoInfo(detailPage, context);
                } catch (error) {
                    console.log('getImageAndVideoInfo Fail');
                }
                imageList.map((image) => {
                    const coltImage = new ColtImage();
                    coltImage.goodsImage = image;
                    coltImage.hash = hash.toHash(image);
                    cItem.coltImageList.push(coltImage);
                });


                await this.getStockInfo(cItem, page, detailPage, url, optionList, product_code, ivtAddPrice);
                return cItem;
            } catch (error) {
                logger.error(error.stack);
            } finally {
                await puppeteer.close(browser, page, global)
            }
        } catch (e) {
            logger.error(e.stack);
        }
    }


    async getStockInfo(cItem, page, detailPage, url, optionList, product_code, ivtAddPrice) {
        let option1 = '';
        let option2 = '';
        let option3 = '';
        let option4 = '';
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

        let stockYn = false;
        let stockOption = '';
        let stockAmout = -999;

        let avail = detailPage('div.product-card-top.product-card-top_full > div.product-card-top__buy > div.product-buy.product-buy_one-line > div').text();
        let avail1 = detailPage('div.order-avail-wrap.order-avail-wrap_not-avail').text();
        let avail2 = detailPage('div.product-card-top__buy > div.product-buy > button.button-ui.notify-btn').text();
        let voidChk = detailPage('div.product-card-top__buy > div.product-buy > button.button-ui.buy-btn');


        if (avail.includes('Товара нет в наличии')) {
            stockOption = 'Out of stock';
            logger.info('The product is out of stock , ' + avail);
        } else if (avail.includes('Скоро будет доступен')) {
            stockOption = '';
            logger.info('Coming Soon , ' + avail + ",  product_code: " + product_code);
        } else if (avail.includes('Продажи прекращены')) {
            stockOption = 'Out of stock';
            logger.info('Sales discontinued , ' + avail);
        } else if (avail1.includes('Товара нет в наличии')) {
            stockOption = 'Out of stock';
            logger.info('The product is out of stock , ' + avail1.replaceAll(/\n/gm, ''));
        } else if (avail2.includes('Уведомить')) {
            stockOption = 'Out of stock';
            logger.info('The product is notify , ' + avail2.replaceAll(/\n/gm, ''));
        } else if (voidChk.length == 0) {
            stockOption = '';
            logger.info('The product is Void , product_code: ' + product_code);
        } else {
            stockOption = 'In stock';
            stockYn = true;
        }

        if (stockYn) {
            stockAmout = await this.requestAddCart(detailPage, page, product_code, url);
            if (stockAmout < 0) {
                stockOption = 'Fail';
            }
        }

        const ivt = new ColtItemIvt();
        await makeItem.makeColtItemIvt(ivt, product_code, ivtAddPrice, option1, option2, option3, option4, stockOption, stockAmout)
        cItem.coltItemIvtList.push(ivt);
    }

    async requestAddCart(detailPage, page, product_code, url) {
        let stockAmout = -999;
        let button = detailPage('div.product-card-top__buy > div.product-buy > button.button-ui.buy-btn').text();

        try {
            if (button.includes('Купить')) {
                //장바구니추가
                try {
                    await page.click('div.product-card-top__buy > div.product-buy > button.button-ui.buy-btn');
                } catch (error) {
                    logger.error('장바구니추가 클릭 error ' + error.stack);
                    await page.evaluate(() => {
                        ([...document.querySelectorAll('.product-card-top__buy > div.product-buy > button.button-ui.buy-btn')].find(element => element.textContent === 'Купить') as HTMLElement).click();
                    });
                }
                await wait.sleep(8);
                //시간이 오래걸려 주석처리
                // await page.reload();
                // await page.waitForSelector('div.product-card-top.product-card-top_full > div.product-card-top__buy > div.product-buy.product-buy_one-line > button.button-ui.buy-btn.button-ui_brand.button-ui_passive-done', {timeout: 5000})

                // const reloadPage = cheerio.load(await page.content());
                // let buttonChk = detailPage('div.product-card-top__buy > div.product-buy > button.button-ui.buy-btn').text()
                // if(buttonChk.includes('В корзине')){
                //     logger.info('장바구니 추가완료')
                // }else{
                //     logger.info('장바구니 추가실패')
                // }            
            }

            //장바구니진입
            let gotoCart = 'https://www.dns-shop.ru/cart/';
            //시크릿모드사용시 새로운페이지에는 장바구니추가가 되지않아 주석처리
            // const cartPage = await context.newPage()
            // await pageSet(page);
            await page.on('dialog', async dialog => {
                await dialog.dismiss();
            });
            try {
                await page.goto(gotoCart, {waitUntil: "networkidle2", timeout: 30000});
                await wait.sleep(5);
                await page.waitForSelector('div.cart-items__product-code', {timeout: 30000});
            } catch (error) {
                await wait.sleep(1);
                logger.error('Goto CartPage Error');
            }
            await wait.sleep(3);
            const cartContent = cheerio.load(await page.content());
            cartContent('div.cart-items__content-container').each((index, el) => {
                let cartItem = cartContent(el);
                let itemCode = cartItem.find('div.cart-items__product-code').text().replaceAll(/\D+/gm, '');
                if (itemCode === product_code) {
                    stockAmout = cartItem.find('div.base-ui-tooltip.base-ui-tooltip_center-bottom').text().replaceAll(/\D+/gm, '');
                }

            });

            //아이템삭제
            await page.evaluate(() => {
                ([...document.querySelectorAll('p.remove-button__title')].find(element => element.textContent === 'Удалить') as HTMLElement).click();
            });

            await wait.sleep(1);

        } catch (error) {
            logger.error('Reqeust Cart Error!');
            logger.error(error.message);
        } finally {
            logger.info('Stock: ' + stockAmout + ' ,#StockID: ' + product_code);
            return stockAmout;
        }

    }

    async makeNotFoundColtItem(cItem: ColtItem, url, collectSite, item_num, detailPage) {
        let title = detailPage('div.site-error-404 > div.site-error-404__message > h1 ').text();
        if (title.includes('Извините, данный товар временно отсутствует в продаже')) {
            let category = 'NO_CATEGORY';
            let image = detailPage('div.site-error-404 > div.site-error-404__image > img').attr('src');
            cItem.collectSite = collectSite;
            cItem.collectUrl = url;
            cItem.siteName = 'DNS';
            cItem.priceStdCd = '017';

            cItem.itemNum = item_num;
            cItem.goodsName = 'Page Not Found';
            cItem.goodsCate = category;
            cItem.brandName = '';
            cItem.price = '0';
            cItem.sitePrice = '0';
            cItem.totalEvalCnt = 0;
            cItem.fivePoint = 0.0;
            cItem.addInfo = '';

            const coltImage = new ColtImage();
            coltImage.goodsImage = image;
            coltImage.hash = hash.toHash(image);
            cItem.coltImageList.push(coltImage);

            const ivt = new ColtItemIvt();
            ivt.stockId = item_num;
            ivt.addPrice = 0;
            ivt.option = 'Not Found';
            ivt.stockAmount = -999;
            cItem.coltItemIvtList.push(ivt);

            logger.info('Not Found Page! , ITEM_NUM: ' + item_num);

        }

    }

    async getImageAndVideoInfo(detailPage, context) {
        let imageList = [];
        let imageJson;
        let videoUrl;

        let script = detailPage('script');
        script.each((i, el) => {
            let html = detailPage(el);
            let text = html.toString();
            if (text.includes('viewerConfig')) {
                //video Url
                let regex = /"viewerConfig":((.*?));/gm;
                let match = regex.exec(text)[1];
                match = match.replaceAll(/}\)/gm, '');
                let obj = JSON.parse(match);
                videoUrl = obj.url;

                //image 
                let regexImg = /"images":((.*?))]/gm;
                let imgList = regexImg.exec(text)[1];
                imageJson = JSON.parse(imgList + ']');
            }
        });

        for (let obj of imageJson) {
            let imageUrl = obj.desktop.orig;
            imageList.push(imageUrl);
        }

        let videoCheck = false;
        let reqUrl = 'https://www.dns-shop.ru' + videoUrl;
        let videoDiv = detailPage('div.product-images-slider__item.product-images-slider__item_add.product-images-slider__item_video');
        if (videoDiv.length > 0) videoCheck = true;
        if (videoCheck) {
            const videoPage = await context.newPage();
            try {
                let videoJson;

                let response = await videoPage.goto(reqUrl, {timeout: 30000});
                await wait.sleep(3);
                let jsonArr = JSON.parse(await response.text());
                let tabs = jsonArr.data.tabs;

                for (let json of tabs) {
                    let type = json.type;
                    if (type == 'video') {
                        videoJson = json.objects;
                    }
                }

                for (let obj of videoJson) {
                    let youtubeUrl = obj.url;
                    imageList.push(youtubeUrl);
                }

            } catch (error) {
                logger.error('VideoPage Request Error!');
            } finally {
                await videoPage.close();
                return imageList;
            }

        }

        return imageList;
    }

    async getOptionInfo(detailPage) {
        let optionList = [];
        detailPage('div.multicard.product-card-top__multi >div.multicard__param').each((index, el) => {
            let optionDiv = detailPage(el);
            let title = optionDiv.find('> div.multicard__param-title').text().replaceAll(/\s+/gm, '');
            let label = '';
            let input = optionDiv.find('> div.multicard__values > input');
            input.each((index, el) => {
                if (el.attribs.checked !== undefined) {
                    label = optionDiv.find('> div.multicard__values > label').eq(index).text();
                }
            });
            optionList.push(title + label);
        });
        return optionList;
    }

    async getTotalEvalutCnt(detailPage) {
        let totalEvalutCnt = detailPage('div.product-card-top__stat > a.product-card-top__rating').text();
        if (totalEvalutCnt.includes('k')) {
            totalEvalutCnt = totalEvalutCnt.replaceAll(/\D+/gm, '');
            totalEvalutCnt = totalEvalutCnt + '000';
        } else if (totalEvalutCnt.includes('нет отзывов')) {
            totalEvalutCnt = totalEvalutCnt.replaceAll(/\D+/gm, '0');
        }
        return totalEvalutCnt;
    }

    async getAddInfo(detailPage, product_code) {
        var addinfoObj = new Object();
        addinfoObj['Product code'] = product_code;
        let service_rating = detailPage('div.product-card-top__stat > a.product-card-top__service-rating').text().replaceAll(/,/gm, '.');
        let service_comment = detailPage('div.product-card-top__stat > a.product-card-top__comments').text().trim();
        if (await validator.isNotUndefinedOrEmpty(service_comment)) addinfoObj['Communicator'] = service_comment;
        if (await validator.isNotUndefinedOrEmpty(service_rating)) addinfoObj['Reliability assessment'] = service_rating;


        detailPage('div.product-characteristics div.product-characteristics__group > div.product-characteristics__spec').each((index, el) => {
            let addInfo = detailPage(el);
            let key = addInfo.find('> div.product-characteristics__spec-title').text();
            key = key.replaceAll(/^\s+|\s+$/gm, "");
            let value = addInfo.find('> div.product-characteristics__spec-value').text();
            value = value.replaceAll(/^\s+|\s+$/gm, "");
            if (validator.isNotUndefinedOrEmpty(key) && validator.isNotUndefinedOrEmpty(value)) {
                if (key.includes('Модель')) addinfoObj[key] = value;
            }
        });

        delete addinfoObj["Режимы и функции съемки"];
        delete addinfoObj["Режимы и функции фотосъемки"];
        delete addinfoObj["Особенности, дополнительно"];
        delete addinfoObj["Особенности и функции видеосъемки"];

        return jsonToStr(addinfoObj);

    }

    async getCateInfo(detailPage) {
        let cateList = [];
        let catelength = detailPage('ol.breadcrumb-list > li ').length - 1;
        detailPage('ol.breadcrumb-list > li ').each((index, el) => {
            let cateName = '';
            if (index == catelength - 1) {
                return;
            } else if (index == catelength) {
                cateName = detailPage(el).find(' > span').text();
                cateList.push(cateName);
            } else {
                cateName = detailPage(el).find(' > a').text();
                cateList.push(cateName);
            }
        });

        let category = cateList.join(" > ") + "";
        return category;
    }

    async getItemNum(url) {
        let regex = /product\/(\w+)/gm;
        let itemNum = regex.exec(url)[1];
        return itemNum;
    }
}


export {DnsDetail};
