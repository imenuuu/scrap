import type {AcqCategory} from "../AcqCategory";
import {logger} from "../../../config/logger/Logger";
import {Leaf} from "../../../data/Leaf";
import {LeafTraverse} from "../../../data/LeafTraverse";
import  {Category} from "../../../data/Category";

const service = require('../../../config/service.json')
const cheerio = require('cheerio')
const puppeteer = require('../../../util/PuppeteerUtil')
const validator = require('../../../util/ValidatorUtil')
const wait = require('../../../util/WaitUtil')
const categoryList = []
class AlkostoCategory implements AcqCategory {

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

    async getCategory(filter: object): Promise<Array<Category>> {
        const [browser, context, page ] = await puppeteer.getPage(this._glbConfig)
        const url: string = 'https://www.alkosto.com/';
        try {
            this.leafTraverse = new LeafTraverse().make('Alkosto')    // siteName
            // '' 안에 사이트 명을 작성

            await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})

            await wait.sleep(3)
            const detailPage = await cheerio.load(await page.content());
            detailPage('ul.main-navigation__container.js-main-navigation-categories > li').each((index, content) => {      //cateogry element
                let parentDiv = detailPage(content)
                let cateUrl : string = 'https://www.alkosto.com' + parentDiv.find(' > a').attr('href') // category Url 엘리먼트 받아오기
                // ex > let cateUrl = detailPage('categoryUrlElement').text();
                console.log(cateUrl)

                let cateName : string = parentDiv.find('> a').attr('title') // category name 엘리먼트 받아오기
                console.log(cateName)

                // ex > let cateName = detailPage('categoryNameElement').text();

                if (this.isTargetCategory()&&cateUrl) {
                    let category: Category = new Category();
                    category.categoryNameList = [this.leafTraverse.rootLeaf.name, cateName]
                    category.categoryUrl = cateUrl;
                    categoryList.push(category);
                }
                if(cateUrl) {

                    const leaf = Leaf.make(cateName, cateUrl, false, false)//  4번째 매개변수는 parentLeaf
                    leaf.parentLeaf = this.leafTraverse.rootLeaf;
                    this.leafTraverse.rootLeaf.addChildLeaf(leaf, this.leafTraverse)
                }
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


        return this.leafTraverse.toCategoryList();
    }

    async second() {
        for (const leaf of this.leafTraverse.rootLeaf.childLeafList) {           // category Leaf 순회
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                await page.goto(leaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
                await wait.sleep(3)

                const detailPage = await cheerio.load(await page.content());

                detailPage('').each((index, content) => {
                    let parentDiv = detailPage(content)
                    const cateName : string = '';
                    const cateUrl : string = '';

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

                    const childLeaf = Leaf.make(cateName, cateUrl, false, false)

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
                detailPage('').each((index, content) => {
                    let parentDiv: any = ''
                    const cateName: string = ''
                    const cateUrl: string = ''

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
    // 이후의 카테고리가 존재할 경우 본인이 third ~ 이후의 function을 만들어서 수집

}
export {AlkostoCategory}