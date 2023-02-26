const service = require("../config/service.json");
const puppeteer = require('./PuppeteerUtil')


exports.getProxy = async function (proxyName, proxyIp, global) {
    if (service.OXYLAB) {
        let ipList = await getOxyLabIpList(global);
        let mod = (this.cnt % ipList.length);
        let ip = ipList[mod];
        global.args.push('--proxy-server=' + ip);
    }
    if (service.LUMINATI) {
        global.args.push('--proxy-server=zproxy.lum-superproxy.io:22225');
    }
}

getOxyLabIpList = async function (global) {
    let browserOxylab = await puppeteer.getBrowser(global);
    let pageOxylab = await browserOxylab.newPage();
    await pageOxylab.authenticate({
        username: 'epopcon',
        password: 'FChB5uEd45',
        key: '4b33bfee-80a6-11eb-927e-901b0ec4424b'
    });
    let response = await pageOxylab.goto(service.OXYLABS_URL);
    let jsonArr = JSON.parse(await response.text());

    await pageOxylab.close();
    await browserOxylab.close();

    let ipList = [];
    for (let json of jsonArr) {
        let ip = json.ip;
        let port = json.port;
        ipList.push(ip + ':' + port);
    }
    return ipList;
}

exports.pageSet = async function (page, proxyName) {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false
        });
    });

    if (service.OXYLAB) {
        await page.authenticate({
            username: 'epopcon',
            password: 'FChB5uEd45',
            key: '4b33bfee-80a6-11eb-927e-901b0ec4424b'
        });

    } else if (service.LUMINATI) {
        await page.authenticate({
            username: service.LUMINATI_ZONE,
            password: 'jhwfsy8ucuh2'
        });
    }

    await page.setDefaultTimeout(50000);
    await page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36");
}
