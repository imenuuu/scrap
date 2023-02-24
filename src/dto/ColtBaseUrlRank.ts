class ColtBaseUrlRank {
    constructor() {

    }

    id: number = -1
    refCateId: number = -1
    rank: number = -1;
    type: string;  // B : BEST , S : SPACIAL , N : NEW , G : GENERAL
    content: string;
    regDt: string;
}

export {ColtBaseUrlRank}