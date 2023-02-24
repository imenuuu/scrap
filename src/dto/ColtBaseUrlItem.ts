class ColtBaseUrlItem {

    constructor() {
    }
    id : number = 0
    url : string = '';
    collectSite : string = '';
    bestItemYn : number = 0;
    bestRank : number = -1;
    eventYn : number = 0;
    newYn : number = 0;
    type : string ='';
    newRank : number = -1;
    itemNum : string = '';
    collectDate : string = '';
    procDt : string ='1900-01-01';
    actPoint : number = 0;
    uptDt : string = '';
    missDateCnt : number = 0;
    specExhibtnYn : number = 0;
    addInfo : string = '{}';
    sellEndYn : string = '0';
    preProcDt : string = '1900-01-01';
    status : number = 1;
    regDt : string = '';
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