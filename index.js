const logger = require('./src/config/logger/Logger');
const detailTask = require('./src/task/DetailTask');
const express = require('express');
const app = express();
const port = 8005;
const bodyParser = require('body-parser');

const chromeConfig = require('./src/config/chrome/ChromeConfig').options;
const service = require('./src/config/service.json');
const validator = require('./src/util/ValidatorUtil');

const urls = {};
const queueLength = 10;

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function launch() {
    await appSetting(app);
    // let collectSite = 'top.naverstore.com'
    // let url = 'https://smartstore.naver.com/americanapparel/products/2536670070'
    // let CLASS_PAT/**/H = validator.validateClassPath(service.detail, collectSite)
    // let task = new detailTask(collectSite, CLASS_PATH, chromeConfig);
    // let item = await task.execute(url);
    // logger.info(`item: ${item}`)

    app.post('/detail', async (req, res) => {
        while (Object.keys(urls).length >= queueLength) {
            await sleep(1000);
            console.log(`queue is full, length: ${Object.keys(urls).length}`);
        }
        const collectSite = req.body.collectSite;
        const url = req.body.url;
        let key = `${collectSite}==${url}`;
        urls[key] = key;
        console.log(key, Object.keys(urls).length);

        let CLASS_PATH = validator.validateClassPath(service.detail, collectSite);
        let task = new detailTask(collectSite, CLASS_PATH, chromeConfig);
        let item = await task.execute(url);
        logger.info(`item: ${item}`);


        // res.send(`CollectSite ${collectSite}, url is ${url}, item is ${item}`)
        res.send({
            result: `CollectSite ${collectSite}, url is ${url}, item is ${item}`,
            item: JSON.parse(JSON.stringify(item))
        });

        delete urls[key];
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

