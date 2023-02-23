class ColtBaseUrlItem {

    constructor() {
    }

    collectSite : string = '';
    url : string = '';
    type : string ='';
    bestItemYn : number = 0;
    specExhibtnYn : number = 0;
    newYn : number = 0;
    itemNum : string = '';
    collectDay : string = '';
    missHandlingPeriod : number = 0;
    actPoint : number = 0;
    addInfo : string = '{}';
    sellEndYn : string = '0';
    procDt : string ='1900-01-01';
    preProcDt : string = '1900-01-01';
    status : number = 1;
    regDt : string = '';
    uptDt : string = '';
    expiredDt : '';

    ColtBaseUrlCate = {
        refUrlId : '',
        cate : '',
        cateUrl : '',
        regDt : ''
    }

    ColtBaseUrlRank = {
        refCateId : '',
        rank : '',
        content : '',
        regDt : ''
    }

    ColtShelfItem = {
        urlId : '',
        goodsName : '',
        collectSite : '',
        collectUrl : '',
        siteName : '',
        price : 0,
        disPrice : 0,
        bundleYn : 0,
        totalEvalutCnt : '',
        avgPoint : '',
        seller : '',
        thumbnail : '',
        addInfo : '',
        hash : 0,
        regDt : '',
        uptDt : ''

    }

}
export {ColtBaseUrlItem}