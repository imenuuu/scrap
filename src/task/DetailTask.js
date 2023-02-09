const logger = require('../config/logger/Logger')

const puppeteer = require('puppeteer');
const service = require('../config/service.json');
class DetailTask{
    constructor(collectSite, dirName, chromeConfig){
        this._collectSite = collectSite;
        this._dirName = dirName;
        this._config = chromeConfig;
    }

    async execute(url, cnt){
        let ip;
    
        if(service.OXYLABS){
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await this.pageSet(page);
            let ipList = await this.getIpList(page);
            let mod = (cnt % ipList.length)
            ip = ipList[mod];
            this._config.args.push('--proxy-server=' + ip);
            //logger.info(`ip : ${ip}`);
        }

        let detailClass = require(`${this._dirName}`)
        let detail = new detailClass(this._config, this._collectSite);
        const item = await detail.extractFromItemList(url);
        return item;
    }

    async pageSet(page) {
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            })
        });
    
        await page.setDefaultTimeout(50000000);
        
        if(service.OXYLABS){
            await page.authenticate({
                username:  'epopcon',
                password: 'FChB5uEd45',
                key: '4b33bfee-80a6-11eb-927e-901b0ec4424b'
            })
        }        
    
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36");
    }

    async getIpList(page){
        let response = await page.goto(service.OXYLABS_URL)
        let jsonArr = JSON.parse(await response.text())

        let ipList = [];
        for(let json of jsonArr){
            let ip = json.ip 
            let port = json.port
            ipList.push(ip + ':' +port);
        }
        return ipList;
    }



}

module.exports = DetailTask;