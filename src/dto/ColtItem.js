const { currentDate, currentDay, collectDay } = require("../util/Dateutil");


class ColtItem {
    ColtItem = {
        itemNum: '',
        goodsName: '',
        goodsCate: '',
        brandName: '',
        collectSite: '',
        priceStdCd: '',
        price: '',
        sitePrice: '',
        colorOption: '',
        sizeOption: '',
        styleOption: '',
        giftOption: '',
        collectUrl: '',
        bestItemYn: 0,
        siteName: '',
        addInfo: '',
        maftOrigin: '',
        materials: '',
        tag: '',
        volume: '',
        type: '',
        orgUrl: '',
        orgMaftDt: '',
        maftDt: '',
        orgGoodsNum: '',
        trustSeller: '',
        useWay: 'A',
        fivePoint: '',
        totalEvalCnt: '',
        status: 1,
        eventYn : '',
        regDt : '',
        uptDt : ''
    }

    ColtImageList =[];

    ColtItemEvalutList = [];

    ColtItemDiscount = {
        itemId: 0,
        collectDay: '',
        option: '',
        discountPrice: '',
        discountRate: '',
        regDt: ''
    }

    ColtItemSiteSellHis = {
        itemNum: '',
        collectSite: '',
        bundleItemYn: -1,
        purCnt: '',
        likeCnt: -1,
        lookCnt: -1,
        regDt: ''
    }


    ColtItemIvtList = [];

}
module.exports = ColtItem;