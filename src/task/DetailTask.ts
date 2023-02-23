import type {Detail} from "../site/detail/Detail";
import type {ColtItem} from "../dto/ColtItem";
import {NaverDetail} from "../site/detail/naver/NaverDetail";
import {DnsDetail} from "../site/detail/dns/DnsDetail";

export class DetailTask {
    private readonly _collectSite: any;
    private readonly _classPath: any;
    private readonly _config: any;

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._classPath = dirName;
        this._config = chromeConfig;
    }

    private detailType = {
        NaverDetail: NaverDetail,
        DnsDetail: DnsDetail
    };

    detailClass(className: string)
        : new (config: string, collectSite: string, cnt: number) => Detail {
        return this.detailType[className];
    }

    async execute(url, cnt): Promise<ColtItem> {
        const detail = new (this.detailClass(this._classPath))(this._config, this._collectSite, cnt);
        const item = await detail.extractItemDetail(url);
        return item;
    }
}