const logger = require('./src/config/logger/Logger');
const detailTask = require('./src/task/DetailTask');
const express = require('express');
const app = express();
const port = 8005;
const bodyParser = require('body-parser');

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');
const {del} = require("express/lib/application");

const urls = {};
const priorities = {};
const queueLength = 1;

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

async function launch() {
    await appSetting(app);
    // let collectSite = 'top.naverstore.com'
    // let url = 'https://smartstore.naver.com/americanapparel/products/2536670070'
    // let CLASS_PATH = validator.validateClassPath(service.detail, collectSite)
    // let task = new detailTask(collectSite, CLASS_PATH, chromeConfig);
    // let item = await task.execute(url);
    // logger.info(`item: ${item}`)

    app.post('/detail', async (req, res) => {
        try {
            const collectSite = req.body.collectSite;
            const url = req.body.url;
            let key = `${collectSite}==${url}`;
            priorities[key] = new Date();

            while (true) {
                if (Object.keys(urls).length < queueLength && key === getPrimaryPriorityKey()) {
                    break;
                }

                await sleep(1000);
                console.log(`queue is full, length: ${Object.keys(urls).length}, ${Object.keys(priorities).length}`);
            }
            delete priorities[key];
            urls[key] = key;
            logger.info(`${key}, ${Object.keys(urls).length}, ${Object.keys(priorities).length}`);


            let item = null;
            try {
                let CLASS_PATH = validator.validateClassPath(service.detail, collectSite);
                let task = new detailTask(collectSite, CLASS_PATH, chromeConfig);
                item = await task.execute(url, cnt++);
            } catch (e) {
                logger.error("detailTask error", e);
            }

            logger.info(`item: ${item}`);
            // res.send(`CollectSite ${collectSite}, url is ${url}, item is ${item}`)
            res.send({
                result: `CollectSite ${collectSite}, url is ${url}, item is ${item}`,
                item: JSON.parse(JSON.stringify(item))
            });

            delete urls[key];
        } catch (e){
            logger.error('post error', e)
        }
    });

}


const appSetting = async function (app) {
    app.listen(port, () => {
        logger.info(`app listening at http://localhost:${port}`);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
};

launch();

