import {ColtItemEvalutInfo} from "./ColtEvalutInfo";

class ColtItemEvalut {
    itemId: number = 0;
    collectDay: string = '';
    avgPoint: string = '';
    goodsComment: string = '';
    hash: number = 0;
    regDt: string = '';

    coltItemEvalutInfo: ColtItemEvalutInfo = new ColtItemEvalutInfo();
}

export {ColtItemEvalut};