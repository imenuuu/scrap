export class ListTask {
    private _collectSite: any;
    private _dirName: any;
    private _config: any;

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._dirName = dirName;
        this._config = chromeConfig;
    }

    async listExecute(category) {

        const listClass = require(`${this._dirName}`)
        const list = new listClass(this._config, this._collectSite, 0);
        const item = await list.getItemUrls(category);
        return item;
    }
}