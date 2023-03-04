import type {AcqCategory} from "../AcqCategory";
import {logger} from "../../../config/logger/Logger";
import {Leaf} from "../../../data/Leaf";
import {LeafTraverse} from "../../../data/LeafTraverse";
import {Category} from "../../../data/Category";

const service = require('../../../config/service.json')
const cheerio = require('cheerio')
const puppeteer = require('../../../util/PuppeteerUtil')
const validator = require('../../../util/ValidatorUtil')
const wait = require('../../../util/WaitUtil')
const categoryList = []

class DnsCategory implements AcqCategory {

    _glbConfig: { [key: string]: any; }
    collectSite: string
    filter: Array<string>
    leafTraverse: LeafTraverse

    constructor(config: { [key: string]: any; }, collectSite: string, filter: string[]) {
        this._glbConfig = config;
        this._glbConfig.userDataDir = service.DETAIL_PUPPET_PROFILE;
        this.collectSite = collectSite
        this.filter = filter
    }

    async getCategory(filter: object): Promise<Array<Category>> {
        const [browser, context, page ] = await puppeteer.getPage(this._glbConfig)
        const url : string = "https://www.dns-shop.ru"
        try {
            this.leafTraverse = new LeafTraverse().make('dns')    // siteName
            await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})

            await wait.sleep(3)
            const detailPage : any = await cheerio.load(await page.content());
            detailPage('.catalog-menu-rootmenu.homepage > div').each((index, content) => {      //cateogry element
                let parentDiv: any = detailPage(content)
                let cateUrl: string = 'https://www.dns-shop.ru' + parentDiv.find(' > a').attr('href')
                console.log("secondUrl :"+cateUrl)

                let cateName: string = parentDiv.find('> a').text()
                console.log(cateName)

                if (this.isTargetCategory()) {
                    let category: Category = new Category();
                    category.categoryNameList = [this.leafTraverse.rootLeaf.name, cateName]
                    category.categoryUrl = cateUrl;
                    categoryList.push(category);
                }

                const leaf: Leaf = Leaf.make(cateName, cateUrl, false, false)//  4번째 매개변수는 parentLeaf
                leaf.parentLeaf = this.leafTraverse.rootLeaf
                this.leafTraverse.rootLeaf.addChildLeaf(leaf, this.leafTraverse)

            })
            await puppeteer.close(browser, page, this._glbConfig)

            if(await this.isNext()) {
                await this.second()

            }
        } catch (e) {
            logger.error(e.stack)
        } finally {
            await puppeteer.close(browser, page, this._glbConfig)
        }


       // return this.leafTraverse.toCategoryList();
        return categoryList
    }

    async second(){
        for (const leaf of this.leafTraverse.rootLeaf.childLeafList) {           // category Leaf 순회
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                await page.goto(leaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
                await wait.sleep(3)
                const detailPage : any = await cheerio.load(await page.content());
                detailPage('.subcategory__item-container > a').each((index, content) => {
                    let parentDiv: any = detailPage(content)
                    const cateName: string = parentDiv.find('> label').text()
                    const cateUrl: string = 'https://www.dns-shop.ru' + parentDiv.attr('href')
                    if (this.isTargetCategory()) {
                        let category: Category = new Category();
                        category.categoryNameList = []
                        leaf.parentLeafNameList.forEach((value)=>{
                            category.categoryNameList.push(value)
                        })
                        category.categoryNameList.push(leaf.name)
                        category.categoryNameList.push(cateName)
                        category.categoryUrl = cateUrl;
                        categoryList.push(category);
                    }

                    const childLeaf: Leaf = Leaf.make(cateName, cateUrl, false, false)
                    childLeaf.parentLeaf = leaf
                    leaf.addChildLeaf(childLeaf, this.leafTraverse)
                })

                await puppeteer.close(browser, page, this._glbConfig)

                if(await this.isNext()) {
                    await this.third(leaf)
                }
            } catch (e) {
                logger.error(e.stack)
            } finally {
                await puppeteer.close(browser, page, this._glbConfig)
            }
        }
        return;
    }

    async third(leaf : Leaf) {
        for (const secondLeaf of leaf.childLeafList) {           // category Leaf 순회
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                await page.goto(secondLeaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
                await wait.sleep(3)
                const detailPage: any = await cheerio.load(await page.content());
                detailPage('.subcategory__item-container > a').each((index, content) => {
                    let parentDiv: any = detailPage(content)
                    const cateName: string = parentDiv.find('> label').text()
                    const cateUrl: string = 'https://www.dns-shop.ru' + parentDiv.attr('href')

                    if (this.isTargetCategory()) {
                        let category: Category = new Category();
                        category.categoryNameList = []

                        secondLeaf.parentLeafNameList.forEach((value)=>{
                            category.categoryNameList.push(value)
                        })
                        category.categoryNameList.push(secondLeaf.name)
                        category.categoryNameList.push(cateName)
                        category.categoryUrl = cateUrl;
                        categoryList.push(category);
                    }

                    const childLeaf: Leaf = Leaf.make(cateName, cateUrl, false, false)
                    childLeaf.parentLeaf = secondLeaf
                    secondLeaf.addChildLeaf(childLeaf, this.leafTraverse)
                })
                await puppeteer.close(browser, page, this._glbConfig)

            } catch (e) {
                logger.error(e.stack)
            } finally {
                await puppeteer.close(browser, page, this._glbConfig)
            }
        }
        return
    }

    async isTargetCategory(){
        return true;
    }

    async isNext(){
        return true;
    }

}
export {DnsCategory}