import {CategoryTask} from "./src/task/CategoryTask";

const logger = require('./src/config/logger/Logger');
const express = require('express');
const app = express();
const port = 8005;
const bodyParser = require('body-parser');

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');


const API_PATH = '/acq/node/list';
const MAX_CONNECTIONS = 1;
const MAX_IDLE_CONNECTIONS = 10;
const urls = {};
const priorities = {};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getPrimaryPriorityKey() {
    return Object.keys(priorities).sort((k1, k2) => {
        return priorities[k1] - priorities[k2];
    })[0];
}

const appSetting = async function (app) {
    app.listen(port, () => {
        logger.info(`app listening at http://localhost:${port}`);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
};

async function waitQueue(key, collectSite, res) {
    priorities[key] = new Date();

    while (true) {
        if (Object.keys(urls).length < MAX_CONNECTIONS && key === getPrimaryPriorityKey()) {
            break;
        }

        if (Object.keys(priorities).length > MAX_IDLE_CONNECTIONS) {
            delete priorities[key];

            let message = `CollectSite ${collectSite}, too many request, ${Object.keys(priorities).length}`;
            res.send({
                result: message,
                item: null
            });

            logger.info(message);
            return false;
        }

        await sleep(1000);
        logger.info(`queue is full, length: ${Object.keys(urls).length}, ${Object.keys(priorities).length}`);
    }
    delete priorities[key];
    urls[key] = key;
    logger.info(`${key}, ${Object.keys(urls).length}, ${Object.keys(priorities).length}`);

    return true;
}

function getClassType(item) {
    if (item instanceof Array && item.length > 0) {
        return "ColtBaseUrlItemList";
    }

    return null;
}

function sendErrorResponse(res, e: Error) {
    res.send({
        type: 'error',
        message: e.message
    });
}


(async () => {
    await appSetting(app);

    app.post(API_PATH, async (req, res) => {
        let key = '';
        try {
            const collectSite = req.body.collectSite;
            const url = req.body.url;
            const category = req.body.category
            key = `${collectSite}==${url}`;
            if (!await waitQueue(key, collectSite, res)) {
                return;
            }

            let cateList = null;
            let fliterList:Array<string> = null;
            try {

                let classPath = validator.validateClassPath(service.list, collectSite);
                const task = new CategoryTask(collectSite, classPath, chromeConfig)
                cateList = await task.execute(fliterList);

            } catch (e) {
                logger.error("listTask error", e);
                sendErrorResponse(res, e);
                delete urls[key];
                return
            }

            // logger.info(`bsUrlItemList: ${coltBsUrlItemList}`);

            // res.send({
            //     type: getClassType(coltBsUrlItemList),
            //     item: JSON.parse(JSON.stringify(coltBsUrlItemList))
            // });

            delete urls[key];
            return
        } catch (e) {
            logger.error('post error', e);
            sendErrorResponse(res, e);
            if (key !== '') {
                delete urls[key]
            }
            return
        }
    });
})()

export {};

