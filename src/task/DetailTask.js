const logger = require('../config/logger/Logger')

class DetailTask{
    constructor(collectSite, dirName, chromeConfig){
        this._collectSite = collectSite;
        this._dirName = dirName;
        this._config = chromeConfig;
    }

    async execute(url){
        let detailClass = require(`${this._dirName}`)
        let detail = new detailClass(this._config, this._collectSite);
        const item = await detail.extractFromItemList(url);
        return item;
    }

}

module.exports = DetailTask;