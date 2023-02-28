import type {AcqDetail} from "../site/detail/AcqDetail";
import type {ColtItem} from "../dto/ColtItem";

export class DetailTask {
    private readonly _collectSite: string;
    private readonly _classPath: string;
    private readonly _config: { [key: string]: any; };

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._classPath = dirName;
        this._config = chromeConfig;
    }

    // private detailType = {
    //     NaverDetail: NaverDetail,
    //     DnsDetail: DnsDetail,
    //     DatartDetail: DatartDetail
    // };

    // detailClass(className: string)
    //     : new (config: { [key: string]: any; }, collectSite: string, cnt: number) => Detail {
    //     return this.detailType[className];
    // }

    async execute(url): Promise<ColtItem> {
        const detailClassModule = require(this._classPath);
        const detailClass = Object.values(detailClassModule)[0] as
            new (config: { [key: string]: any; }, collectSite: string) => AcqDetail;
        const detail = new detailClass(this._config, this._collectSite);
        const item = await detail.extractItemDetail(url);
        return item;
    }
}