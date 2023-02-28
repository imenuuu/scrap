import {CategoryTask} from "./src/task/CategoryTask";
import {logger} from "./src/config/logger/Logger";
import {Category} from "./src/data/Category";
import * as ApiUtil from "./src/util/ApiUtil";

const express = require('express');
const app = express();
const port = 8007;
const bodyParser = require('body-parser');

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');


const API_PATH = '/acq/node/category';
const urls = {};


const appSetting = async function (app) {
    app.listen(port, () => {
        logger.info(`app listening at http://localhost:${port}`);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
};

function getClassType(item) {
    if (item instanceof Array<Category> && item.length > 0) {
        return "Category";
    }

    return null;
}

(async () => {
    await appSetting(app);

    app.post(API_PATH, async (req, res) => {
        let key = '';
        try {
            const collectSite = req.body.collectSite;
            const filterList= req.body.filterList
            key = `${collectSite}==${collectSite}`;
            if (!await ApiUtil.waitQueue(urls, key, collectSite, res)) {
                return;
            }

            let cateList = null;
            let fliterList: object = null;
            try {

                let classPath = validator.validateClassPath(service.category, collectSite);
                const task = new CategoryTask(collectSite, classPath, chromeConfig)
                cateList = await task.execute(collectSite, filterList);

            } catch (e) {
                logger.error("categoryTask error", e);
                ApiUtil.sendErrorResponse(res, e);
                delete urls[key];
                return
            }

            // logger.info(`bsUrlItemList: ${coltBsUrlItemList}`);

            res.send({
                type: getClassType(Category),
                item: JSON.parse(JSON.stringify(cateList))
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

