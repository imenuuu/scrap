import type {ColtItemIvt} from "./ColtItemIvt";
import type {ColtItemDiscount} from "./ColtItemDiscount";
import type {ColtImage} from "./ColtImage";
import type {ColtItemEvalut} from "./ColtEvalut";


class ColtItem {

    constructor() {
    }

    orgGoodsNum: string = '';
    itemNum: string = '';
    goodsName: string = '';
    goodsCate: string = '';
    brandName: string = '';
    maftDt: string = '';
    orgMaftDt: string = '';
    maftOrigin: string = '';
    collectSite: string = '';
    priceStdCd: string = '';
    price: string = '';
    sitePrice: string = '';
    colorOption: string = '';
    sizeOption: string = '';
    styleOption: string = '';
    giftOption: string = '';
    collectUrl: string = '';
    bestItemYn: number = 0;
    siteName: string = '';
    materials: string = '';
    addInfo: string = '';
    volume: string = '';
    tag: string = '';
    type: string = '';
    fivePoint: number = 0;
    totalEvalCnt: number = 0;
    orgUrl: string = '';
    trustSeller: string = '';
    useWay: string = 'A';
    status: number = 1;
    regDt: string = '';
    uptDt: string = '';
    eventYn: number = 0;

    coltItemIvtList: Array<ColtItemIvt> = [];
    coltItemDiscountList: Array<ColtItemDiscount> = [];
    coltItemEvalutList: Array<ColtItemEvalut> = [];
    coltImageList: Array<ColtImage> = [];

    coltItemSiteSellHis = {
        itemNum: '',
        collectSite: '',
        bundleItemYn: -1,
        purCnt: '',
        likeCnt: -1,
        lookCnt: -1,
        regDt: ''
    };
}

export {ColtItem};