const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ColtItem = require('../../../dto/ColtItem');
const ColtIvt = require('../../../dto/ColtItemIvt');
const ColtImage = require('../../../dto/ColtImage');
const hash = require('../../../util/HashUtil');
const { jsonToStr, strToJson } = require('../../../util/Jsonutil');
const logger = require('../../../config/logger/Logger');
const service = require('../../../config/service.json');
let ipCnt;
let ipList;
let global;

class DatartDetail {
    private _glbConfig: any;
    private collectSite: any;
    private OXYLABS: any;
    private LUMINATI: any;
    private luminati_zone: any;
    private cnt: any;

    constructor(config, collectSite, cnt) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        global = this._glbConfig;
        this.collectSite = collectSite;
        this.OXYLABS = service.OXYLABS;
        this.LUMINATI = service.LUMINATI;
        this.luminati_zone = 'lum-customer-epopcon-zone-zone_ru';
        this.cnt = cnt;
    }

    async extractFromItemList(url) {
        try {

            const item = await this.extractItemDetail(url, this.collectSite)
            return item;
            
        } catch (e) {
            logger.error(e.stack)
        }
    }

    async extractItemDetail(url, collectSite) {
         if(this.OXYLABS){
            let ipList = await this.getIpList();
            let mod = (this.cnt % ipList.length)
            let ip = ipList[mod];
            global.args.push('--proxy-server=' + ip);
        }
        if(this.LUMINATI){
            global.args.push('--proxy-server=zproxy.lum-superproxy.io:22225');
        }

        const browser = await puppeteer.launch(global);
        let context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        await this.pageSet(page);
       
       
        try {
            for(let i = 0; i < 5; i++) {
                let parseChecker = true
                try {
                    await page.goto(url, { waitUntil: "networkidle0" }, {timeout: 20000});
                    await sleep(3);
                    parseChecker = await pageControl(page);
                    parseChecker = await parseCheck(page, "div.code-widget")
                } catch (error) {
                    logger.error("gotoError : "+error.message);
                }
                if(parseChecker == false)
                    break;
            }           
    
            let cItem = new ColtItem();

            const frames = await page.$$("iframe")
            let videoList = new Array();        
            for(let checkFrame of frames){
                try {
                    let videoSrc = ""
                    let videoData = await checkFrame.getProperty("src")
                    videoSrc = await videoData.jsonValue();
                    // let videoSrc = await checkFrame.$eval("iframe", element => element.src);
                    if(videoSrc?.includes("media.flixcar") || videoSrc?.includes("youtube")){
                        videoList.push(videoSrc)
                    }                
                } catch (error) {
                    continue;
                }
            }

            const detailPage = cheerio.load(await page.content());

            let category = await this.getCategory(page)
            if(!await isNotUndefinedOrEmpty(category)){
                category = 'NO_CATEGORY';
            }
    
            let itemNumString = detailPage("div.code-widget > span:nth-child(2)").text().trim()
            let itemKodString = detailPage("div.code-widget > span:nth-child(1)").text().trim()
            let itemNum = itemNumString.split(": ")[1]
            let itemKod = itemKodString.split(": ")[1]
            
            let goodsName = detailPage("div.block-title > h1.product-detail-title").text().trim()
    
            let priceDiv = detailPage("div.price-wrap")
            let price;
            let sitePrice;
            if (priceDiv.length != 0) {
                // sitePrice = priceDiv.text().trim().replace(/[^0-9]/g, "")
                sitePrice = priceDiv.contents().filter(function () {return this.type === "text";})
                                .text().trim().replace(/[^0-9]/g, "")
                sitePrice = Number(sitePrice)
                let oldPriceDiv = detailPage("span.cut-price > del")
                if (oldPriceDiv.length != 0 && sitePrice != 0) {
                    price = oldPriceDiv.text().trim().replace(/[^0-9]/g, "")
                    price = Number(price)
                    let discountRate = Math.round((price - sitePrice) / price * 100)
                    cItem.coltItemDiscountList.discountPrice = sitePrice;
                    cItem.coltItemDiscountList.discountRate = discountRate;
                } else {
                    price = sitePrice
                }
            } 
    
            let evalutDiv = detailPage("div.rating-wrap > span")
            let avgPoint;
            let totalEvalutCnt;
            if (evalutDiv.length != 0) {
                let point = evalutDiv.text().trim()
                if(point.length == 1) {
                    avgPoint = point + ".0"
                } else {
                    avgPoint = point
                }
                totalEvalutCnt = detailPage("div.rating-wrap > a").text().trim()
            } else {
                avgPoint = 0
                totalEvalutCnt = 0
            }
            let addInfo = await this.getAddInfo(page, itemKod)
            await this.makeColtItem(cItem, url, collectSite, goodsName, itemNum, category, '', avgPoint, totalEvalutCnt, addInfo, price);     
            await this.getOptionStock(page, cItem, itemNum, sitePrice);
            await this.getImage(page, cItem, videoList);
    
            if(await isNotUndefinedOrEmpty(itemNum) && itemNum != undefined && itemNum!=null)
                return cItem;
            else
                return null;
    
        } catch (error) {
            logger.error(error.stack)
        }finally{
            if(this.OXYLABS) global.args.pop()
            page.close();
            browser.close();
        }
    }

    async getIpList(){
        let browserOxylab = await puppeteer.launch(global);
        let pageOxylab = await browserOxylab.newPage();
        await pageOxylab.authenticate({
            username:  'epopcon',
            password: 'FChB5uEd45',
            key: '4b33bfee-80a6-11eb-927e-901b0ec4424b'
        })
        let response = await pageOxylab.goto(service.OXYLABS_URL)
        let jsonArr = JSON.parse(await response.text())

        pageOxylab.close();
        browserOxylab.close();

        let ipList = [];
        for(let json of jsonArr){
            let ip = json.ip 
            let port = json.port
            ipList.push(ip + ':' +port);
        }
        return ipList;
    }

    async getOptionStock(page, cItem: ColtItem, itemNum, sitePrice) {
        const ivt = new ColtIvt();
        ivt.ColtItemIvt.stockId = itemNum;
        ivt.ColtItemIvt.addPrice = sitePrice;
        ivt.ColtItemIvt.stockAmount = -999;
        try {
            let detailPage = cheerio.load(await page.content());
            let stockStatus = detailPage("span.product-availability-state").text().trim()
            if(sitePrice == 0 || stockStatus == "Není skladem"){
                ivt.ColtItemIvt.option = "Out of stock";
            } else {
                ivt.ColtItemIvt.option = "In stock";
            }
            cItem.coltItemIvtList.push(ivt);
        } catch (error) {
            logger.error("optionError : " + error)
        }
    }

    async makeColtItem(cItem: ColtItem, url, collectSite,  title, item_num, category, brand_name, avgPoint, totalEvalutCnt, addInfo, orgPrice){
        cItem.collectSite = collectSite;
        cItem.collectUrl = url;
        cItem.siteName = 'Datart';
        cItem.priceStdCd = '018';
    
        cItem.itemNum = item_num;
        cItem.goodsName = title;
        cItem.goodsCate = category;
        cItem.brandName = brand_name;
        cItem.price = orgPrice;
        cItem.sitePrice = orgPrice;
        cItem.totalEvalCnt = totalEvalutCnt;
        cItem.fivePoint = avgPoint;
        cItem.addInfo = addInfo;
    }
    
    async getAddInfo(page, itemKod) {
        let infoObj = new Object()
        try {
            let detailPage = cheerio.load(await page.content());
            infoObj["Kód"] = itemKod
            detailPage("table.table-borderless > tbody.collapse > tr").each((index, list) => {
                let infoKey = detailPage(list).find("th").text().trim()
                let infoValue = detailPage(list).find("td").text().trim().replaceAll(/\n/g, '').replaceAll(/\"/g, '').replaceAll(/   /g, '')
                if((infoKey != "" && infoValue != "") || (infoKey != undefined && infoValue != undefined)){
                    infoObj[infoKey] = infoValue;
                }            
            });
            return jsonToStr(infoObj);
        } catch (error) {
            logger.error("addInfoError : " + error)
            return "";
        }
    }
    
    async getCategory(page) {
        try {
            let detailPage = cheerio.load(await page.content());
            let length = detailPage("li.swiper-slide").length -1;
            let category = ""
            detailPage("li.swiper-slide").each((index, list) => {
                if(index != length){
                    category = category + detailPage(list).find("a").attr("title") + " > "
                }else if(index == length){
                    category = category + detailPage(list).find("a").text()
                }        
            });
    
            category = "(#M)"+category
            return category;
        } catch (error) {
            logger.error("categoryError : " + error)
            return ""
        }
    }

    async getImage(page, cItem: ColtItem, videoList) {
        try {
            let detailPage = cheerio.load(await page.content());
            detailPage("div.product-gallery-slider > div.owl-stage-outer > div.owl-stage > div.owl-item").each((index, list) => {
                let imageUrl = detailPage(list).find("> div").attr("data-src")
                if(imageUrl != undefined && imageUrl != null) {
                    const coltImage = new ColtImage();
                    coltImage.ColtImage.goodsImage = imageUrl;
                    coltImage.ColtImage.hash = hash.toHash(imageUrl);
                    cItem.coltImageList.push(coltImage);
                }            
            });
            for(let videoUrl of videoList){
                const coltImage = new ColtImage();
                coltImage.ColtImage.goodsImage = videoUrl;
                coltImage.ColtImage.hash = hash.toHash(videoUrl);
                cItem.coltImageList.push(coltImage);
            }
        } catch (error) {
            logger.error("imageError : " + error)
        }
    }

    async pageSet(page) {
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            })
        });

        if(this.OXYLABS){
            await page.authenticate({
                username:  'epopcon',
                password: 'FChB5uEd45',
                key: '4b33bfee-80a6-11eb-927e-901b0ec4424b'
            })
            
        }

        if(this.LUMINATI){
            await page.authenticate({
                username:  this.luminati_zone,
                password: 'jhwfsy8ucuh2'
            })
        }
    
        await page.setDefaultTimeout(50000000);
    
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36");
    }

}

async function isNotUndefinedOrEmpty(value){
    if( value == "" || 
        value == null || 
        value == undefined ){
        return false
    }else{
        return true
    }
}


async function sleep(sec) {
    sec = sec * 1000
    return new Promise((resolve) => {
        setTimeout(resolve, sec);
    })
}

async function pageControl(page){
    try {
        let videoCheckDiv = await parseCheck(page, "div.flix_hs_product_video")
        if(!videoCheckDiv) {
            await page.click("div.flix_hs_product_video > svg");
            await page.waitForTimeout(8000);
        }            
        return false
    } catch (error) {
        logger.error("can't pageControl")
        return true
    }    
}

async function parseCheck(page, selector){
    try {
        await page.waitForSelector(selector, {timeout: 5000});
        return false
    } catch (error) {
        return true
    }    
}



module.exports = DatartDetail
export {DatartDetail};