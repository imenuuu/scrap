import * as puppeteer from 'puppeteer'

const proxy = require("./ProxyUtil");


export async function getPage(global) {
    await proxy.stealthMode()

    const browser = await puppeteer.launch(global)

    let context

    if (global.proxyConfig['contextUse'])
        context = await browser.createIncognitoBrowserContext()
    const page = context === undefined ? await browser.newPage() : await context.newPage();

    await proxy.pageSet(page, global)
    await proxy.pushProxy(global)

    return [browser, context, page]
};

export async function close(browser, page, global) {
    if (!page.isClosed()) {
        await page.close()
    }
    if (browser.isConnected()) {
        await browser.close()
        await proxy.popProxy(global)
    }
};

