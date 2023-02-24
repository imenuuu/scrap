class ColtBaseEvt {
    constructor() {
    }

    id: number = -1;
    collectSite: string = "";
    eventNum: string = "";
    hash: string = "";
    subject: string = "";
    smallImageUrl: string = "";
    mainImageUrl: string = "";
    collectUrl: string = "";
    collectDay: string = ""; // 수집일
    eventKind: string = ""; // 이벤트 종류
    endYn: number;
    regId: string;
    regDt: string;
}

export {ColtBaseEvt}