import {LeafTraverse} from '../../../data/LeafTraverse';
import {logger} from "../../../config/logger/Logger";
import {Leaf} from "../../../data/Leaf";

const puppeteer = require('../../../util/PuppeteerUtil');
const wait = require('../../../util/WaitUtil')
const global = require('../../../config/chrome/ChromeConfig')
const cheerio = require('cheerio')
const leafTraverse = new LeafTraverse()

async function start() {

    let ran = Math.random()
    let check = ran % 285

    let url = 'https://www.dns-shop.ru/'
    const [browser, context, page] = await puppeteer.getPage(global.options)

    try {
        await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})
        await wait.sleep(3)

        const detailPage = await cheerio.load(await page.content());
       // leafTraverse.makeRootLef("dns")     // siteName
        detailPage('.catalog-menu-rootmenu.homepage > div').each((index, content) => {      //cateogry element
            let parentDiv = detailPage(content)
            let cateUrl = 'https://www.dns-shop.ru' + parentDiv.find(' > a').attr('href')
            let cateName = parentDiv.find('> a').text()
            const leaf = new Leaf()
            //leaf.makeLeaf(cateName, cateUrl, leafTraverse.rootLeaf.depth + 1, leafTraverse.rootLeaf)    //  4번째 매개변수는 parentLeaf
            //leafTraverse.rootLeaf.childLeafList.push(leaf)
        })
        await puppeteer.close(browser, page, global.options)

        await second()
    } catch (e) {
        logger.error(e.stack)
    } finally {

    }
    const aa =  leafTraverse.rootLeaf
    console.log(aa)
    return;
}

async function second() {
    /*for (const leaf of leafTraverse.rootLeaf.childLeafList) {           // category Leaf 순회
        const [browser, context, page] = await puppeteer.getPage(global.options)

        try {
            await page.goto(leaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
            await wait.sleep(3)
            const detailPage = await cheerio.load(await page.content());
            detailPage('.subcategory__item-container > a').each((index, content) => {
                let parentDiv = detailPage(content)
                const cateName = parentDiv.find('> label').text()
                const cateUrl = 'https://www.dns-shop.ru'+parentDiv.attr('href')
                const childLeaf = new Leaf()
                childLeaf.makeLeaf(cateName, cateUrl, leaf.depth + 1, leaf)
                leaf.childLeafList.push(childLeaf)
            })
        } catch (e) {
            logger.error(e.message)
        } finally {
            await puppeteer.close(browser, page, global.options)
        }
    }
    return;*/
}

start()