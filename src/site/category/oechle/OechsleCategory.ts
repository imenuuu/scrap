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
class OechsleCategory implements AcqCategory {

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
        const url: string = 'https://www.oechsle.pe';
        try {
            this.leafTraverse = new LeafTraverse().make('Oechsle')    // siteName
            await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})

            /*
            if(detailPage('a.btn-close')) {
                await page.click('a.btn-close')
            }
             */
            /*

            await page.mouse.wheel({deltaY: 1000});
            await page.mouse.wheel({deltaY: 1000});
            await wait.sleep(1)
            await page.mouse.wheel({deltaY: 1000});
            await wait.sleep(1)

             */
            await wait.sleep(5)

            const detailPage = await cheerio.load(await page.content());


            detailPage('section.container-mejores-categorias > div > div > div > div').each((index, content) => {      //cateogry element
                let parentDiv = detailPage(content)

                let cateUrl : string = url +parentDiv.find('> a ').attr('href'); // category Url 엘리먼트 받아오기
                let cateName : string = parentDiv.attr('title')// category name 엘리먼트 받아오기


                if (this.isTargetCategory()&&cateUrl){
                    if(categoryList.length<12) {
                        let category: Category = new Category();
                        category.categoryNameList = [this.leafTraverse.rootLeaf.name, cateName]
                        category.categoryUrl = cateUrl;
                        categoryList.push(category);
                    }
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
            const url: string = 'https://www.oechsle.pe';

            try {
                await page.goto(leaf.url, {waitUntil: "networkidle2"}, {timeout: 30000})
                await wait.sleep(5)

                const detailPage = await cheerio.load(await page.content());

                detailPage('div.botones-top.plp-tags.d-none.d-lg-block.mb-5.new-btn.slick-initialized.slick-slider.slick-dotted > div > div > a').each((index, content) => {
                    let parentDiv = detailPage(content)
                    let cateName : string = parentDiv.attr('title'); // category name 엘리먼트 받아오기
                    let cateUrl : string = url+parentDiv.attr('href')


                    let category: Category = new Category();
                    category.categoryNameList = []
                    leaf.parentLeafNameList.forEach((value)=>{
                        category.categoryNameList.push(value)
                    })
                    category.categoryNameList.push(leaf.name)
                    category.categoryNameList.push(cateName)
                    category.categoryUrl = cateUrl;
                    categoryList.push(category);

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
                await wait.sleep(5)
                const detailPage: any = await cheerio.load(await page.content());

                let select : string = '';

                if(detailPage('div.botones-top.plp-tags.d-none.d-lg-block.mb-5.new-btn.slick-initialized.slick-slider.slick-dotted')){
                    select = 'div.botones-top.plp-tags.d-none.d-lg-block.mb-5.new-btn.slick-initialized.slick-slider.slick-dotted > div > div > a'
                }
                else {
                    select = 'div.botones-top.plp-tags.d-none.d-lg-block.mb-5.new-btn.slick-initialized.slick-slider > div > div > a'
                }

                detailPage(select).each((index, content) => {
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
export {OechsleCategory}