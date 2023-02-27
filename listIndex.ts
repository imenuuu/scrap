import {ListTask} from "./src/task/ListTask";
import {logger} from "./src/config/logger/Logger";
import * as ApiUtil from "./src/util/ApiUtil";

const express = require('express');
const app = express();
const port = 8005;
const bodyParser = require('body-parser');

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');


const API_PATH = '/acq/node/list';
const urls = {};

const appSetting = async function (app) {
    app.listen(port, () => {
        logger.info(`app listening at http://localhost:${port}`);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
};


function getClassType(item) {
    if (item instanceof Array && item.length > 0) {
        return "ColtBaseUrlItem";
    }

    return null;
}

/**
 * let collectSite = 'top.naverstore.com'
 * let url = 'https://smartstore.naver.com/americanapparel/products/2536670070'
 * let CLASS_PATH = validator.validateClassPath(service.detail, collectSite)
 * let task = new detailTask(collectSite, CLASS_PATH, chromeConfig);
 * let item = await task.execute(url);
 * logger.info(`item: ${item}`)
 *
 * return {
 *     "type": "ColtItem", // dto class name
 *     "item": item // item object
 * }
 */
(async () => {
    await appSetting(app);

    app.post(API_PATH, async (req, res) => {
        let key = '';
        try {
            const collectSite = req.body.collectSite;
            const category = req.body.category
            key = `${collectSite}==${JSON.stringify(category)}`;
            if (!await ApiUtil.waitQueue(urls, key, collectSite, res)) {
                return;
            }

            let coltBsUrlItemList = null;
            try {
                category.categoryNameList = category.categoryNameList.join(" > ")
                let classPath = validator.validateClassPath(service.list, collectSite);
                const task = new ListTask(collectSite, classPath, chromeConfig)
                coltBsUrlItemList = await task.execute(category);

            } catch (e) {
                logger.error("listTask error", e);
                ApiUtil.sendErrorResponse(res, e);
                delete urls[key];
                return
            }

            logger.info(`bsUrlItemList: ${coltBsUrlItemList}`);

            res.send({
                type: getClassType(coltBsUrlItemList),
                item: JSON.parse(JSON.stringify(coltBsUrlItemList))
            });

            delete urls[key];
            return
        } catch (e) {
            logger.error('post error', e);
            ApiUtil.sendErrorResponse(res, e);
            if (key !== '') {
                delete urls[key]
            }
            return
        }
    });
})()

export {};