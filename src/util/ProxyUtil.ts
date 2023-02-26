const service = require("../config/service.json");
const request = require('request');

let ipList


export async function pushProxy(global) {
    let ip = 'zproxy.lum-superproxy.io:22225'

    if (global.proxyConfig['proxyName'] === 'oxyLab' || service.OXYLAB) {
        if (ipList === undefined)
            ipList = await getOxyLabIpList()
        ip = ipList[Math.random() % ipList.length]
    }

    if (!global.args[global.args.length - 1].includes('--proxy-server='))
        global.args.push('--proxy-server=' + ip);
}

async function getOxyLabIpList() {

    const data = await oxyLabIpList()
    let jsonArr
    let ipList = [];

    if (typeof data === "string") {
        jsonArr = JSON.parse(data)
    }

    for (let json of jsonArr) {
        let ip = json.ip;
        let port = json.port;
        ipList.push(ip + ':' + port);
    }

    return ipList;
}

function oxyLabIpList() {
    return new Promise(function (resolve, reject) {
        request({
            url: 'https://api.oxylabs.io/v1/proxies/lists/4b33bfee-80a6-11eb-927e-901b0ec4424b',
            auth: {
                username: 'epopcon',
                password: 'FChB5uEd45'
            }
        }, (error, response) => {
            if (response.statusCode === 200)
                resolve(response.body)
        })
    })
}

export async function popProxy(global) {
    if (global.args[global.args.length - 1].includes('--proxy-server='))
        global.args.pop()
}


export async function pageSet(page, global) {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false
        });
    });
    // 기본값은 서비스  그렇지 않으면 매개변수로 사용
    let credential = await getPageCredential(global)

    if (global.proxyConfig['proxyName'] === 'oxyLab' || service.OXYLAB) {
        credential['key'] = global.proxyConfig.key
    }

    await page.authenticate(credential);
    await page.setDefaultTimeout(500000);
    await page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36");
};

async function getPageCredential(global) {
    return {
        username: global.proxyConfig.username,
        password: global.proxyConfig.password,
    }
}