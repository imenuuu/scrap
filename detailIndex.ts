import {DetailTask} from "./src/task/DetailTask";

const logger = require('./src/config/logger/Logger');
const express = require('express');
const app = express();
const port = 8005;
const bodyParser = require('body-parser');

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');
const ColtItem = require("./src/dto/ColtItem");

let taskType = 'list'
const API_PATH = '/acq/node/detail';
const MAX_CONNECTIONS = 1;
const MAX_IDLE_CONNECTIONS = 10;
const urls = {};
const priorities = {};

let cnt = 0;

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
    if (item instanceof ColtItem) {
        return "ColtItem";
    }

    return null;
}

function sendErrorResponse(res, e: Error) {
    res.send({
        type: 'error',
        message: e.message
    });
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
            const url = req.body.url;
            key = `${collectSite}==${url}`;
            if (!await waitQueue(key, collectSite, res)) {
                return;
            }

            let item = null;
            try {

                let CLASS_PATH = validator.validateClassPath(service.detail, collectSite);
                const task = new DetailTask(collectSite, CLASS_PATH, chromeConfig);
                item = await task.execute(url, cnt);
                cnt = cnt > 300 ? 0 : cnt;

            } catch (e) {
                logger.error("detailTask error", e);
                sendErrorResponse(res, e);
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