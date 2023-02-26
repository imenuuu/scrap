const proxy = require("./ProxyUtil");
const service = require('../../src/config/service.json')
import puppeteer from 'puppeteer'


exports.getBrowser = async function(global){
    return await puppeteer.launch(global)
}

exports.getContext = async function(browser){
    return await browser.createIncognitoBrowserContext()
}

exports.getPage = async function (context) {
    const page = await context.newPage();
    await proxy.pageSet(page)
    return page
}

exports.closePage = async function (browser, page) {

    if (browser.isConnected()) {
        await page.close()
        await browser.close()
    }

}
