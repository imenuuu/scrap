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
class ShopeeCategory implements AcqCategory {

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
        const url: string = 'https://shopee.vn';
        try {
            this.leafTraverse = new LeafTraverse().make('SHOPEE')    // siteName
            // '' 안에 사이트 명을 작성

            await page.goto(url, {waitUntil: "networkidle2"}, {timeout: 30000})



            await wait.sleep(3)

            await page.mouse.click(0, 0, {button: 'left', clickCount: 1});



            await page.hover('div.home-category-list > div > div.shopee-header-section__content > div > div.carousel-arrow.carousel-arrow--next.carousel-arrow--hint')
            await page.click('div.home-category-list > div > div.shopee-header-section__content > div > div.carousel-arrow.carousel-arrow--next')
            await wait.sleep(3)

            const detailPage = await cheerio.load(await page.content());




            detailPage('div.home-category-list > div > div.shopee-header-section__content > div > div.image-carousel__item-list-wrapper > ul > li').each((index, content) => {      //cateogry element

                let parentDiv = detailPage(content)



                parentDiv.find('>div > a').each((index,content) => {
                    let parentDiv = detailPage(content)


                    let cateUrl : string = url+parentDiv.attr('href');

                    let cateName : string = parentDiv.text();


                    let category: Category = new Category();
                    category.categoryNameList = [this.leafTraverse.rootLeaf.name, cateName]
                    category.categoryUrl = cateUrl;
                    categoryList.push(category);



                    const leaf = Leaf.make(cateName, cateUrl, false, false)//  4번째 매개변수는 parentLeaf
                    leaf.parentLeaf = this.leafTraverse.rootLeaf;
                    this.leafTraverse.rootLeaf.addChildLeaf(leaf, this.leafTraverse);



                });



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

                let detailPage = await cheerio.load(await page.content());
                /*

                if(detailPage('div.shopee-category-list__toggle-btn')) {
                    await page.click('div.shopee-category-list__toggle-btn')
                }
                if (detailPage('div.shopee-filter-group.shopee-facet-filter > div.folding-items.shopeee-filter-group__body.folding-items--folded > div.stardust-dropdown.folding-items__toggle > div.stardust-dropdown__item-header > div')) {
                    await page.click('div.shopee-filter-group.shopee-facet-filter > div.folding-items.shopeee-filter-group__body.folding-items--folded > div.stardust-dropdown.folding-items__toggle > div.stardust-dropdown__item-header > div')
                }

                 */

                await wait.sleep(3)
                detailPage('div.shopee-category-list__category > div.folding-items.shopee-category-list__sub-category-list.folding-items--folded > a').each( (index, content) => {


                    wait.sleep(10)

                    let parentDiv = detailPage(content)

                    let cateName: string = parentDiv.text();
                    let cateUrl: string = 'https://shopee.vn' + parentDiv.attr('href'); // category name 엘리먼트 받아오기

                    let category: Category = new Category();
                    category.categoryNameList = []

                    leaf.parentLeafNameList.forEach((value) => {
                        category.categoryNameList.push(value)
                    })

                    category.categoryNameList.push(leaf.name)
                    category.categoryNameList.push(cateName)
                    category.categoryUrl = cateUrl;
                    categoryList.push(category);


                    const childLeaf = Leaf.make(cateName, cateUrl, false, false)
                    childLeaf.parentLeaf = leaf
                    leaf.addChildLeaf(childLeaf, this.leafTraverse)

                })
                if(detailPage('div.stardust-dropdown__item-body.stardust-dropdown__item-body')){
                    detailPage('div.stardust-dropdown__item-body.stardust-dropdown__item-body> div > a').each( (index, content) => {


                        wait.sleep(10)

                        let parentDiv = detailPage(content)

                        let cateName: string = parentDiv.text();
                        let cateUrl: string = 'https://shopee.vn' + parentDiv.attr('href'); // category name 엘리먼트 받아오기

                        let category: Category = new Category();
                        category.categoryNameList = []

                        leaf.parentLeafNameList.forEach((value) => {
                            category.categoryNameList.push(value)
                        })

                        category.categoryNameList.push(leaf.name)
                        category.categoryNameList.push(cateName)
                        category.categoryUrl = cateUrl;
                        categoryList.push(category);


                        const childLeaf = Leaf.make(cateName, cateUrl, false, false)
                        childLeaf.parentLeaf = leaf
                        leaf.addChildLeaf(childLeaf, this.leafTraverse)

                    })
                }
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
                const detailPage: any = await cheerio.load(await page.content());

                await wait.sleep(10)

                detailPage('div.shopee-filter-panel > div.shopee-filter-group.shopee-location-filter > div.folding-items.shopeee-filter-group__body.folding-items--folded > div').each((index, content) => {
                    let parentDiv: any = detailPage(content)
                    let cateName: string = parentDiv.find('> div > label > span ').text();
                    let cateUrl: string = secondLeaf.url + '?facet=' + parentDiv.find('> div > label > input ').attr('value')
                    if (this.isTargetCategory()) {
                        let category: Category = new Category();
                        category.categoryNameList = []
                        console.log(cateUrl)

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
                if(detailPage('div.shopee-filter-group.shopee-location-filter > div.folding-items.shopeee-filter-group__body.folding-items--folded > div.stardust-dropdown.folding-items__toggle > div.stardust-dropdown__item-body > div > div')){
                    detailPage('div.shopee-filter-group.shopee-location-filter > div.folding-items.shopeee-filter-group__body.folding-items--folded > div.stardust-dropdown.folding-items__toggle > div.stardust-dropdown__item-body > div > div').each( (index, content) => {


                        wait.sleep(10)

                        let parentDiv = detailPage(content)

                        let cateName: string = parentDiv.find('> div > label > span ').text();
                        let cateUrl: string = 'https://shopee.vn' + parentDiv.attr('href'); // category name 엘리먼트 받아오기
                        console.log('서브 카테고리'+cateName)

                        let category: Category = new Category();
                        category.categoryNameList = []

                        leaf.parentLeafNameList.forEach((value) => {
                            category.categoryNameList.push(value)
                        })

                        category.categoryNameList.push(leaf.name)
                        category.categoryNameList.push(cateName)
                        category.categoryUrl = cateUrl;
                        console.log(cateUrl)
                        categoryList.push(category);


                        const childLeaf = Leaf.make(cateName, cateUrl, false, false)
                        childLeaf.parentLeaf = leaf
                        leaf.addChildLeaf(childLeaf, this.leafTraverse)

                    })
                }
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
    async third(leaf: Leaf, url: any) {
        for (const secondLeaf of leaf.childLeafList) {           // category Leaf 순회
            const [browser, context, page] = await puppeteer.getPage(this._glbConfig)
            try {
                await wait.sleep(3)
                let detailPage: any = await cheerio.load(await page.content());

                detailPage('div.shopee-filter-group.shopee-facet-filter > div.folding-items.shopeee-filter-group__body.folding-items--folded > div.shopee-filter.shopee-checkbox-filter').each(async (index, content) => {
                        let parentDiv: any = detailPage(content)
                        let cateName: string = parentDiv.find('> div > label > span ').text();
                        console.log(cateName)

                        let secondCateUrl: string = url + '?facet=' + parentDiv.find('> div > label > input ').attr('value')
                        console.log(secondCateUrl)

                        let category: Category = new Category();
                        category.categoryNameList = []

                        leaf.parentLeafNameList.forEach((value) => {
                            category.categoryNameList.push(value)
                        })
                        category.categoryNameList.push(leaf.name)
                        category.categoryNameList.push(cateName)
                        category.categoryUrl = secondCateUrl;
                        categoryList.push(category);

                        const childLeaf: Leaf = Leaf.make(cateName, secondCateUrl, false, false)
                        childLeaf.parentLeaf = leaf
                        leaf.addChildLeaf(childLeaf, this.leafTraverse)


                    })
                    console.log(categoryList)



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
export {ShopeeCategory}