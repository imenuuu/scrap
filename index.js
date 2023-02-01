const logger = require('./src/config/logger/Logger')
const detailTask = require('./src/task/DetailTask');
const express = require('express')
const app = express()
const port = 8005
const bodyParser = require('body-parser')

const chromeConfig = require('./src/config/chrome/ChromeConfig').options
const service = require('./src/config/service.json')
const validator = require('./src/util/ValidatorUtil')

async function launch(){
    await appSetting(app);
    
    app.post('/detail', async (req,res)=> {
        const collectSite = req.body.collectSite;
        const url = req.body.url;

        let CLASS_PATH = validator.validateClassPath(service.detail, collectSite)
        let task = new detailTask(collectSite, CLASS_PATH, chromeConfig);
        let item = await task.execute(url);
        logger.info(`item: ${item.ColtItem}`)
       
      
        res.send(`CollectSite ${collectSite}, url is ${url}, item is ${item.ColtItem}`)
    });

}




const appSetting = async function (app) {
    app.listen(port, () => {
        logger.info(`app listening at http://localhost:${port}`);
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
}

launch();

