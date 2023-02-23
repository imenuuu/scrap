import type {Detail} from "../site/detail/Detail";
import {NaverDetail} from "../site/detail/naver/NaverDetail";
import type {ColtItem} from "../dto/ColtItem";

export class DetailTask {
    private _collectSite: any;
    private _dirName: any;
    private _config: any;

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._dirName = dirName;
        this._config = chromeConfig;
    }

    private detailType = {
        NaverDetail: NaverDetail,
    };

    detailClass(className: string)
        : new (config: string, collectSite: string, cnt: number) => Detail {
        return this.detailType[className];
    }

    async execute(url, cnt): Promise<ColtItem> {

        const detail = new (this.detailClass('NaverDetail'))(this._config, this._collectSite, cnt);
        const item = await detail.extractItemDetail(url);
        return item;
    }
}