import type {ColtBaseUrlCate} from "./ColtBaseUrlCate";
import type {ColtBaseEvt} from "./ColtBaseEvt";
import type {ColtBaseUrlRank} from "./ColtBaseUrlRank";
import type {ColtBaseUrlSchedule} from "./ColtBaseUrlSchedule";
import type {ColtBaseUrlItemNaverList} from "./ColtBaseUrlItemNaverList";
import type {ColtBaseUrlMaster} from "./ColtBaseUrlMaster";
import type {ColtShelfItem} from "./ColtShelfItem";
import type {ColtBaseCateBrandRank} from "./ColtBaseCateBrandRank";
import type {ColtItemSiteSellHis} from "./ColtItemSiteSellHis";


class ColtBaseUrlItem {

    constructor(coltShelfItem : ColtShelfItem) {
        this.coltShelfItem = coltShelfItem;
    }

    id: number = 0
    url: string = '';
    collectSite: string = '';
    bestItemYn: number = 0;
    bestRank: number = -1;
    eventYn: number = 0;
    newYn: number = 0;
    newRank: number = -1;
    itemNum: string = '';
    collectDate: string = '';
    procDt: string = '1900-01-01';
    actPoint: number = 0;
    uptDt: string = '';
    missDateCnt: number = 0;
    releaseDate: string = ''
    type: string = 'U';
    price: string;
    discountPrice: string
    collectInterval: string
    addInfo: string = '{}';
    status: number = 1;
    minDiff: number = 0;
    sellEndYn: string = '0';
    specExhibtnYn: number = 0;
    isCateUpdate: boolean = true;

    coltBaseUrlCateList: Array<ColtBaseUrlCate> = [];
    coltBaseEvtList: Array<ColtBaseEvt> = [];
    coltBaseUrlRank: Array<ColtBaseUrlRank> = [];
    coltBaseUrlSchedule: Array<ColtBaseUrlSchedule> = [];
    coltBaseUrlItemNaverList: Array<ColtBaseUrlItemNaverList> = [];
    coltBaseUrlMaster: ColtBaseUrlMaster;
    coltShelfItem: ColtShelfItem;
    coltBaseCateBrandRank: ColtBaseCateBrandRank;
    coltItemSiteSellHis: ColtItemSiteSellHis;


}

export {ColtBaseUrlItem}