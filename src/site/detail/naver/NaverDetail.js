const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const ColtItem = require('../../../dto/ColtItem');
const logger = require('../../../config/logger/Logger');
const service = require('../../../config/service.json');

class NaverDetail {
    constructor(config, collectSite) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        global = this._glbConfig;
        this.collectSite = collectSite;
        this.luminati_zone = 'lum-customer-epopcon-zone-zone1';
    }

    async extractFromItemList(url) {
        try {

            const item = await this.extractItemDetail(url)

            return item;
            
        } catch (e) {
            logger.error(e.stack)
            return null;
        }
    }
    
    async extractItemDetail(url) {
        const browser = await puppeteer.launch(global);
        const page = await browser.newPage();
        await this.pageSet(page);
        try {
            await page.goto(url, { waitUntil: "networkidle2" }, {timeout: 30000});

        } catch (error) {
            return null;
        }
        
        const detailPage = cheerio.load(await page.content());

        let cItem = new ColtItem();

        let title = detailPage('title').text();
        logger.info('title: ' + title)
        cItem.ColtItem.goodsName = title

        page.close();
        browser.close();
        return cItem;
        
    }

    async  pageSet(page) {
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            })
        });
    
        await page.setDefaultTimeout(50000000);
        await page.authenticate({
            username:  this.luminati_zone,
            password: 'jhwfsy8ucuh2'
        })
    
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36");
    }

}

module.exports = NaverDetail;

