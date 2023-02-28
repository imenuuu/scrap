import {DetailTask} from "./src/task/DetailTask";
import {ColtItem} from "./src/dto/ColtItem";
import {logger} from "./src/config/logger/Logger";
import * as ApiUtil from "./src/util/ApiUtil";

const express = require('express');
const app = express();
const port = 8005;

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');
const bodyParser = require('body-parser');

const API_PATH = '/acq/node/detail';
const urls = {};
let cnt = 0;


function getClassType(item) {
    if (item instanceof ColtItem) {
        return "ColtItem";
    }

    return null;
}


const appSetting = async function (app) {
    app.listen(port, () => {
        logger.info(`app listening at http://localhost:${port}`);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
};
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
            const url = req.body.url;
            key = `${collectSite}==${url}`;
            if (!await ApiUtil.waitQueue(urls, key, collectSite, res)) {
                return;
            }

            let item = null;
            try {
                let classPath = validator.validateClassPath(service.detail, collectSite);
                const task = new DetailTask(collectSite, classPath, chromeConfig);
                item = await task.execute(url);
            } catch (e) {
                logger.error(e.stack);
                ApiUtil.sendErrorResponse(res, e);
                delete urls[key];
                return
            }

            logger.info(`item: ${item}`);
            res.send({
                type: getClassType(item),
                item: JSON.parse(JSON.stringify(item))
            });

            delete urls[key];
            return
        } catch (e) {
            logger.error(e.stack);
            ApiUtil.sendErrorResponse(res, e);
            if (key !== '') {
                delete urls[key]
            }
            return
        }
    });
})()

export {};