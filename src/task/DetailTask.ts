export class DetailTask {
    private _collectSite: any;
    private _dirName: any;
    private _config: any;

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._dirName = dirName;
        this._config = chromeConfig;
    }

    async execute(url, cnt) {

        const detailClass = require(`${this._dirName}`)
        const detail = new detailClass(this._config, this._collectSite, cnt);
        const item = await detail.extractFromItemList(url);
        return item;
    }
}