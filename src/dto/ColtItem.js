const {currentDate, currentDay, collectDay} = require("../util/Dateutil");


class ColtItem {
    ColtItem = {
        orgGoodsNum: '',
        itemNum: '',
        goodsName: '',
        goodsCate: '',
        brandName: '',
        maftDt: '',
        orgMaftDt: '',
        maftOrigin: '',
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
        materials: '',
        addInfo: '',
        volume: '',
        tag: '',
        type: '',
        fivePoint: '',
        totalEvalCnt: '',
        orgUrl: '',
        trustSeller: '',
        useWay: 'A',
        status: 1,
        eventYn: '',
        regDt: '',
        uptDt: '',

        coltItemIvtList: [],
        coltItemDiscount: {
            itemId: 0,
            collectDay: '',
            option: '',
            discountPrice: '',
            discountRate: '',
            regDt: ''
        },
        coltItemEvalutList: [],
        coltImageList: [],

        coltItemSiteSellHis: {
            itemNum: '',
            collectSite: '',
            bundleItemYn: -1,
            purCnt: '',
            likeCnt: -1,
            lookCnt: -1,
            regDt: ''
        }
    };


}

module.exports = ColtItem;