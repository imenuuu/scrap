import {ColtItem} from "../../../dto/ColtItem";
import type {AcqDetail} from "../AcqDetail";
import {ColtImage} from "../../../dto/ColtImage";
import {ColtItemDiscount} from "../../../dto/ColtItemDiscount";
import {ColtItemIvt} from "../../../dto/ColtItemIvt";
import {logger} from "../../../config/logger/Logger";

const wait = require('../../../util/WaitUtil')
const makeItem = require('../../../util/ItemUtil')
const puppeteer = require('../../../util/PuppeteerUtil')
const validator = require('../../../util/ValidatorUtil')
const cheerio = require('cheerio');
const hash = require('../../../util/HashUtil');
const {jsonToStr, strToJson} = require('../../../util/Jsonutil');
const service = require('../../../config/service.json');

class DatartDetail implements AcqDetail {
    _glbConfig: { [key: string]: any; };
    collectSite: string;

    cnt: number;

    constructor(config, collectSite, cnt) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        this.collectSite = collectSite;
        this.cnt = cnt;
    }

    async extractItemDetail(url): Promise<ColtItem> {
        try {
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)
            try {
                for (let i = 0; i < 5; i++) {
                    let parseChecker = true;
                    try {
                        await page.goto(url, {waitUntil: "networkidle0"}, {timeout: 20000});
                        await validator.sleep(3);
                        parseChecker = await pageControl(page);
                        parseChecker = await parseCheck(page, "div.code-widget");
                    } catch (error) {
                        logger.error("gotoError : " + error.message);
                    }
                    if (parseChecker == false)
                        break;
                }

                let cItem = new ColtItem();

                const frames = await page.$$("iframe");
                let videoList = new Array();
                for (let checkFrame of frames) {
                    try {
                        let videoSrc = "";
                        let videoData = await checkFrame.getProperty("src");
                        videoSrc = await videoData.jsonValue();
                        // let videoSrc = await checkFrame.$eval("iframe", element => element.src);
                        if (videoSrc?.includes("media.flixcar") || videoSrc?.includes("youtube")) {
                            videoList.push(videoSrc);
                        }
                    } catch (error) {
                        continue;
                    }
                }

                const detailPage = cheerio.load(await page.content());

                let category = await this.getCategory(page);
                if (!await validator.isNotUndefinedOrEmpty(category)) {
                    category = 'NO_CATEGORY';
                }

                let itemNumString = detailPage("div.code-widget > span:nth-child(2)").text().trim();
                let itemKodString = detailPage("div.code-widget > span:nth-child(1)").text().trim();
                let itemNum = itemNumString.split(": ")[1];
                let itemKod = itemKodString.split(": ")[1];

                let goodsName = detailPage("div.block-title > h1.product-detail-title").text().trim();

                let priceDiv = detailPage("div.price-wrap");
                let price;
                let sitePrice;
                if (priceDiv.length != 0) {
                    // sitePrice = priceDiv.text().trim().replace(/[^0-9]/g, "")
                    sitePrice = priceDiv.contents().filter(function () {
                        return this.type === "text";
                    })
                        .text().trim().replace(/[^0-9]/g, "");
                    sitePrice = Number(sitePrice);
                    let oldPriceDiv = detailPage("span.cut-price > del");
                    if (oldPriceDiv.length != 0 && sitePrice != 0) {
                        price = oldPriceDiv.text().trim().replace(/[^0-9]/g, "");
                        price = Number(price);
                        let discountRate = Math.round((price - sitePrice) / price * 100);
                        const coltDis = new ColtItemDiscount();
                        coltDis.discountPrice = String(sitePrice);
                        coltDis.discountRate = String(discountRate);
                        cItem.coltItemDiscountList.push(coltDis);
                    } else {
                        price = sitePrice;
                    }
                }

                let evalutDiv = detailPage("div.rating-wrap > span");
                let avgPoint;
                let totalEvalutCnt;
                if (evalutDiv.length != 0) {
                    let point = evalutDiv.text().trim();
                    if (point.length == 1) {
                        avgPoint = point + ".0";
                    } else {
                        avgPoint = point;
                    }
                    totalEvalutCnt = detailPage("div.rating-wrap > a").text().trim();
                } else {
                    avgPoint = 0;
                    totalEvalutCnt = 0;
                }
                let addInfo = await this.getAddInfo(page, itemKod);
                await makeItem.makeColtItem(cItem, url, this.collectSite,'Datart','018' ,goodsName, itemNum, category, '', avgPoint, totalEvalutCnt, addInfo, price);
                await this.getOptionStock(page, cItem, itemNum, sitePrice);
                await this.getImage(page, cItem, videoList);

                if (await validator.isNotUndefinedOrEmpty(itemNum) && itemNum != undefined && itemNum != null)
                    return cItem;
                else
                    return null;

            } catch (error) {
                logger.error(error.stack);
            } finally {
                await puppeteer.close(browser, page, this._glbConfig)
            }
        } catch (e) {
            logger.error(e.stack);
        }
    }

    async getOptionStock(page, cItem: ColtItem, itemNum, sitePrice) {
        const ivt = new ColtItemIvt();
        ivt.stockId = itemNum;
        ivt.addPrice = sitePrice;
        ivt.stockAmount = -999;
        try {
            let detailPage = cheerio.load(await page.content());
            let stockStatus = detailPage("span.product-availability-state").text().trim();
            if (sitePrice == 0 || stockStatus == "Není skladem") {
                ivt.option = "Out of stock";
            } else {
                ivt.option = "In stock";
            }
            cItem.coltItemIvtList.push(ivt);
        } catch (error) {
            logger.error("optionError : " + error);
        }
    }


    async getAddInfo(page, itemKod) {
        let infoObj = new Object();
        try {
            let detailPage = cheerio.load(await page.content());
            infoObj["Kód"] = itemKod;
            detailPage("table.table-borderless > tbody.collapse > tr").each((index, list) => {
                let infoKey = detailPage(list).find("th").text().trim();
                let infoValue = detailPage(list).find("td").text().trim().replaceAll(/\n/g, '').replaceAll(/\"/g, '').replaceAll(/   /g, '');
                if ((infoKey != "" && infoValue != "") || (infoKey != undefined && infoValue != undefined)) {
                    infoObj[infoKey] = infoValue;
                }
            });
            return jsonToStr(infoObj);
        } catch (error) {
            logger.error("addInfoError : " + error);
            return "";
        }
    }

    async getCategory(page) {
        try {
            let detailPage = cheerio.load(await page.content());
            let length = detailPage("li.swiper-slide").length - 1;
            let category = "";
            detailPage("li.swiper-slide").each((index, list) => {
                if (index != length) {
                    category = category + detailPage(list).find("a").attr("title") + " > ";
                } else if (index == length) {
                    category = category + detailPage(list).find("a").text();
                }
            });

            category = "(#M)" + category;
            return category;
        } catch (error) {
            logger.error("categoryError : " + error);
            return "";
        }
    }

    async getImage(page, cItem: ColtItem, videoList) {
        try {
            let detailPage = cheerio.load(await page.content());
            detailPage("div.product-gallery-slider > div.owl-stage-outer > div.owl-stage > div.owl-item").each((index, list) => {
                let imageUrl = detailPage(list).find("> div").attr("data-src");
                if (imageUrl != undefined && imageUrl != null) {
                    const coltImage = new ColtImage();
                    coltImage.goodsImage = imageUrl;
                    coltImage.hash = hash.toHash(imageUrl);
                    cItem.coltImageList.push(coltImage);
                }
            });
            for (let videoUrl of videoList) {
                const coltImage = new ColtImage();
                coltImage.goodsImage = videoUrl;
                coltImage.hash = hash.toHash(videoUrl);
                cItem.coltImageList.push(coltImage);
            }
        } catch (error) {
            logger.error("imageError : " + error);
        }
    }
}

async function pageControl(page) {
    try {
        let videoCheckDiv = await parseCheck(page, "div.flix_hs_product_video");
        if (!videoCheckDiv) {
            await page.click("div.flix_hs_product_video > svg");
            await page.waitForTimeout(8000);
        }
        return false;
    } catch (error) {
        logger.error("can't pageControl");
        return true;
    }
}

async function parseCheck(page, selector) {
    try {
        await page.waitForSelector(selector, {timeout: 5000});
        return false;
    } catch (error) {
        return true;
    }
}


export {DatartDetail};