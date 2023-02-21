const logger = require('../config/logger/Logger')

const puppeteer = require('puppeteer');
const service = require('../config/service.json');
class DetailTask{
    private _collectSite: any;
    private _dirName: any;
    private _config: any;
    constructor(collectSite, dirName, chromeConfig){
        this._collectSite = collectSite;
        this._dirName = dirName;
        this._config = chromeConfig;
    }

    async execute(url, cnt){

        let detailClass = require(`${this._dirName}`)
        let detail = new detailClass(this._config, this._collectSite, cnt);
        const item = await detail.extractFromItemList(url);
        return item;
    }

}

module.exports = DetailTask;