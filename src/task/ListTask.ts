import type {AcqList} from "../site/list/AcqList";
import type {ColtBaseUrlItem} from "../dto/ColtBaseUrlItem";

export class ListTask {
    private readonly _collectSite: string;
    private readonly _classPath: string;
    private readonly _config: { [key: string]: any; };

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._classPath = dirName;
        this._config = chromeConfig;
    }

    async execute(category) : Promise<Array<ColtBaseUrlItem>> {

        const listClassModule = require(this._classPath);
        const listClass = Object.values(listClassModule)[0] as
            new (config: { [key: string]: any; }, collectSite: string) => AcqList;
        const list = new listClass(this._config, this._collectSite);
        const item = await list.getItemUrls(category);
        return item;
    }
}