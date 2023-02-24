class ColtShelfItem {
    constructor() {
    }

    id: number = 0;
    urlId: number = 0;
    goodsName: string = "";
    collectSite: string = "";
    collectUrl: string = "";
    siteName: string = "";
    price: number = 0;
    discountPrice: number = 0;
    bundleYn: number = 0;
    avgPoint: number = 0
    totalEvalut: number = 0;
    seller: string = "";
    thumbnail: string = "";
    hash: number = 0
    regDt: string;
    uptDt: string;
    addInfo: string = "";
    jsonData: string = null;
}

export {ColtShelfItem}