import {logger} from "../config/logger/Logger";
import {ColtItem} from "../dto/ColtItem";


const MAX_CONNECTIONS = 1;
const MAX_IDLE_CONNECTIONS = 10;
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

async function waitQueue(urls: {}, key: string, collectSite: string, res) {
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


function sendErrorResponse(res, e: Error) {
    res.send({
        type: 'error',
        message: e.message
    });
}

export {sleep, getPrimaryPriorityKey, waitQueue, sendErrorResponse}