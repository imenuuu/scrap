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
class MakroCategory implements AcqCategory {

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
        const url: string = 'https://www.makro.co.za';
        try {
            this.leafTraverse = new LeafTraverse().make('Makro')    // siteName
            // '' 안에 사이트 명을 작성

            await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})
            await wait.sleep(3)
            const detailPage = await cheerio.load(await page.content());




            detailPage('.owl-stage > div').each((index, content) => {      //cateogry element
                let parentDiv = detailPage(content)

                let cateUrl : string = parentDiv.find('> div > div > div > a').attr('href'); // category Url 엘리먼트 받아오기
                // ex > let cateUrl = detailPage('categoryUrlElement').text();
                let cateName : string =parentDiv.find('> div > div > div').text(); // category name 엘리먼트 받아오기
                // ex > let cateName = detailPage('categoryNameElement').text();


                if (this.isTargetCategory()&&cateUrl){
                    let category: Category = new Category();
                    category.categoryNameList = [this.leafTraverse.rootLeaf.name, cateName]
                    category.categoryUrl = cateUrl;
                    categoryList.push(category);
                }

                if(cateUrl) {
                    const leaf = Leaf.make(cateName, cateUrl, false, false)//  4번째 매개변수는 parentLeaf
                    leaf.parentLeaf = this.leafTraverse.rootLeaf;
                    this.leafTraverse.rootLeaf.addChildLeaf(leaf, this.leafTraverse);
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

                detailPage('.row > div > a').each((index, content) => {
                    let parentDiv = detailPage(content)
                    let cateName : string = parentDiv.find('> div > div ').text(); // category name 엘리먼트 받아오기
                    let scrapUrl=parentDiv.attr('href')
                    let cateUrl : string = 'https://www.makro.co.za'+parentDiv.attr('href')


                    if (this.isTargetCategory()&&scrapUrl) {
                        if(scrapUrl.includes('https://www.makro.co.za')){
                            cateUrl = scrapUrl
                        }
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
                    if(parentDiv.attr('href')) {
                        const childLeaf = Leaf.make(cateName, cateUrl, false, false)
                        childLeaf.parentLeaf = leaf
                        leaf.addChildLeaf(childLeaf, this.leafTraverse)
                    }
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
                detailPage('.row > div > a').each((index, content) => {
                    let parentDiv: any =  detailPage(content)
                    let cateName : string = parentDiv.find('> div > div ').text(); // category name 엘리먼트 받아오기

                    let scrapUrl=parentDiv.attr('href')

                    let cateUrl : string = 'https://www.makro.co.za'+parentDiv.attr('href')

                    if (this.isTargetCategory()&&scrapUrl) {
                        if(scrapUrl.includes('https://www.makro.co.za')){
                            cateUrl = scrapUrl
                        }
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

                    if(parentDiv.attr('href')) {
                        const childLeaf: Leaf = Leaf.make(cateName, cateUrl, false, false)
                        childLeaf.parentLeaf = secondLeaf
                        secondLeaf.addChildLeaf(childLeaf, this.leafTraverse)
                    }
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

    /*
    // 이후의 카테고리가 존재할 경우 본인이 third ~ 이후의 function을 만들어서 수집
    async fourth(leaf: Leaf) {
        console.log("fourth")
        for (const thirdReaf of leaf.childLeafList) {           // category Leaf 순회
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)

            try {
                await page.goto(thirdReaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
                await wait.sleep(3)
                const detailPage: any = await cheerio.load(await page.content());
                detailPage('.row > div > a').each((index, content) => {
                    let parentDiv: any =  detailPage(content)
                    let cateName : string = parentDiv.find('> div > div ').text(); // category name 엘리먼트 받아오기

                    let scrapUrl=parentDiv.attr('href')

                    let cateUrl : string = 'https://www.makro.co.za'+parentDiv.attr('href')

                    if(scrapUrl.includes('https://www.makro.co.za')){
                        cateUrl = scrapUrl
                    }

                    if (this.isTargetCategory()&&scrapUrl) {
                        console.log("thirdUrl :"+cateUrl)
                        let category: Category = new Category();
                        category.categoryNameList = []

                        thirdReaf.parentLeafNameList.forEach((value)=>{
                            category.categoryNameList.push(value)
                        })
                        category.categoryNameList.push(thirdReaf.name)
                        category.categoryNameList.push(cateName)
                        category.categoryUrl = cateUrl;
                        categoryList.push(category);
                    }

                    const childLeaf: Leaf = Leaf.make(cateName, cateUrl, false, false)
                    childLeaf.parentLeaf = thirdReaf
                    thirdReaf.addChildLeaf(childLeaf, this.leafTraverse)
                })
                await puppeteer.close(browser, page, this._glbConfig)

                if(await this.isNext()) {
                    await this.fourth(leaf)
                }

            } catch (e) {
                logger.error(e.stack)
            } finally {
                await puppeteer.close(browser, page, this._glbConfig)
            }
        }
        return
    }

     */

    async isTargetCategory(){
        return true;
    }

    async isNext(){
        return true;
    }




}
export {MakroCategory}