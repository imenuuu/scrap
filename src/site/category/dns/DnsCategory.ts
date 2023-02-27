import type {AcqCategory} from "../AcqCategory";
import {logger} from "../../../config/logger/Logger";
import {Leaf} from "../../../data/Leaf";
import {LeafTraverse} from "../../../data/LeafTraverse";
import type {Category} from "../../../data/Category";

const service = require('../../../config/service.json')
const cheerio = require('cheerio')
const puppeteer = require('../../../util/PuppeteerUtil')
const validator = require('../../../util/ValidatorUtil')
const wait = require('../../../util/WaitUtil')

class DnsCategory implements AcqCategory {

    _glbConfig: { [key: string]: any; }
    collectSite: string
    filter: Array<string>
    leafTraverse: LeafTraverse

    constructor(config, collectSite, filter) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        this.collectSite = collectSite
        this.filter = filter
    }

    async getCategory(url: string, filter: string): Promise<Array<Category>> {
        const [browser, context, page ] = await puppeteer.getPage(this._glbConfig)
        try {
            this.leafTraverse = new LeafTraverse().make('dns')    // siteName
            await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})

            await wait.sleep(3)
            const detailPage = await cheerio.load(await page.content());
            detailPage('.catalog-menu-rootmenu.homepage > div').each((index, content) => {      //cateogry element
                let parentDiv = detailPage(content)
                let cateUrl = 'https://www.dns-shop.ru' + parentDiv.find(' > a').attr('href')
                let cateName = parentDiv.find('> a').text()
                const leaf = Leaf.make(cateName, cateUrl, false, false)//  4번째 매개변수는 parentLeaf
                leaf.parentLeaf = this.leafTraverse.rootLeaf
                this.leafTraverse.rootLeaf.addChildLeaf(leaf,this.leafTraverse)
            })
            await puppeteer.close(browser, page, this._glbConfig)

            await this.second()
        } catch (e) {
            logger.error(e.stack)
        } finally {
            await puppeteer.close(browser, page, this._glbConfig)
        }


        return this.leafTraverse.toCategoryList();
    }

    async second() {
        for (const leaf of this.leafTraverse.rootLeaf.childLeafList) {           // category Leaf 순회
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                await page.goto(leaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
                await wait.sleep(3)
                const detailPage = await cheerio.load(await page.content());
                detailPage('.subcategory__item-container > a').each((index, content) => {
                    let parentDiv = detailPage(content)
                    const cateName = parentDiv.find('> label').text()
                    const cateUrl = 'https://www.dns-shop.ru' + parentDiv.attr('href')
                    const childLeaf = Leaf.make(cateName, cateUrl, false, false)
                    childLeaf.parentLeaf = leaf
                    leaf.addChildLeaf(childLeaf, this.leafTraverse)
                })
                await puppeteer.close(browser, page, this._glbConfig)
            } catch (e) {
                logger.error(e.stack)
            } finally {
                await puppeteer.close(browser, page, this._glbConfig)
            }
        }
        return;
    }

}
export {DnsCategory}