const crypto = require('crypto');
const logger = require('../config/logger/Logger');

exports.toHash = function(key){
    let hash = '';
    if(key == undefined) return hash;
    try{
    
        let hashAl = crypto.createHash('sha256').update(key).digest('base64');
        for(let i = 0; i<hashAl.length; i++){
            hash = hash + hashAl.charAt(i).charCodeAt(0);
        }
        if(hash.length>20) {
            hash = hash.slice(-19, -1);
        }

    } catch(error){
        logger.error(error);
        logger.info('input :: ' + key + ' output :: ' + hash);
    } 
    
    return hash;
}