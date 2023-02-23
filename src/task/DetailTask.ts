import type {Detail} from "../site/detail/Detail";
import type {ColtItem} from "../dto/ColtItem";
import {NaverDetail} from "../site/detail/naver/NaverDetail";
import {DnsDetail} from "../site/detail/dns/DnsDetail";
import {DatartDetail} from "../site/detail/datart/DatartDetail";

export class DetailTask {
    private readonly _collectSite: string;
    private readonly _classPath: string;
    private readonly _config: { [key: string]: any; };

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._classPath = dirName;
        this._config = chromeConfig;
    }

    private detailType = {
        NaverDetail: NaverDetail,
        DnsDetail: DnsDetail,
        DatartDetail: DatartDetail
    };

    detailClass(className: string)
        : new (config: { [key: string]: any; }, collectSite: string, cnt: number) => Detail {
        return this.detailType[className];
    }

    async execute(url, cnt): Promise<ColtItem> {
        const detail = new (this.detailClass(this._classPath))(this._config, this._collectSite, cnt);
        const item = await detail.extractItemDetail(url);
        return item;
    }
}