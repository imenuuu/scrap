import puppeteer from 'puppeteer'

const proxy = require("./ProxyUtil");


exports.getPage = async function (global) {
    const browser = await puppeteer.launch(global)
    let context = ''

    if (global.proxyConfig['contextUse'])
        context = await browser.createIncognitoBrowserContext()
    const page = context === '' ? await browser.newPage() : await context.newPage();

    await proxy.pageSet(page, global)
    await proxy.pushProxy(global)

    return [browser, context, page]
};

exports.close = async function (browser, page, global) {
    if (!page.isClosed()) {
        await page.close()
    }
    if (browser.isConnected()) {
        await browser.close()
        await proxy.popProxy(global)
    }
};

