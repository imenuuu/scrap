const logger = require('../config/logger/Logger');
const { jsonToStr, strToJson } = require('../util/Jsonutil');

exports.validateClassPath = function(service, collectSite){
    let classPath = '';
    service.forEach( (obj) => {
        if(obj.COLLECT_SITE == collectSite){
            classPath =  obj.CLASS_PATH;
            return obj.CLASS_PATH;
        }
    })
    return classPath;
}

exports.validatePrice = function(price, emptyValue) {
    if(isUndefinedOrEmpty(price)){
        price = 0
        emptyValue.push('price')
    }else{
        price = price.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return price;
}

exports.validateDisPrice = function(dis_price, emptyValue) {
    if(isUndefinedOrEmpty(dis_price)){
        dis_price = 0
        emptyValue.push('dis_price')
    }else{
        dis_price = dis_price.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return dis_price;
}

exports.validateThumbnail = function(thumbnail, emptyValue) {
    if(isUndefinedOrEmpty(thumbnail)){
        thumbnail = ''
        emptyValue.push('thumbnail')
    }
    return thumbnail;
}

exports.validateAvgPoint = function(avgPoint, emptyValue) {
    if(isUndefinedOrEmpty(avgPoint)){
        avgPoint = ''
        emptyValue.push('avgPoint')
    }
    return avgPoint;
}

exports.validateEvalutCnt = function(evalutCnt, emptyValue) {
    if(isUndefinedOrEmpty(evalutCnt)){
        evalutCnt = 0
        emptyValue.push('evalutCnt')
    }else{
        evalutCnt = evalutCnt.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return evalutCnt;
}


//디테일 Validator
exports.validateDetailPrice = function(price, emptyValue, shelfItem) {
    if(isUndefinedOrEmpty(price)){
        price = shelfItem.PRICE
        emptyValue.push('price')
        if(isUndefinedOrEmpty(price))
            price = 0
    }else{
        price = price.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return price;
}

exports.validateDetailDisPrice = function(dis_price, emptyValue, shelfItem) {
    if(isUndefinedOrEmpty(dis_price)){
        dis_price = shelfItem.DIS_PRICE
        if(isUndefinedOrEmpty(dis_price))
            dis_price = 0
    }else{
        dis_price = dis_price.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return dis_price;
}

exports.validateDetailAvgPoint = function(avgPoint, emptyValue, shelfItem) {
    if(isUndefinedOrEmpty(avgPoint)){
        avgPoint = shelfItem.AVG_POINT
        emptyValue.push('avgPoint')
    }else{
        avgPoint = avgPoint.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return avgPoint;
}

exports.validateDetailEvalutCnt = function(evalutCnt, emptyValue, shelfItem) {
    if(isUndefinedOrEmpty(evalutCnt)){
        evalutCnt = shelfItem.TOTAL_EVAL_CNT
        emptyValue.push('evalutCnt')
    }else{
        evalutCnt = evalutCnt.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return evalutCnt;
}

exports.validateDetailGoodsName = function(goodsName, emptyValue, shelfItem) {
    if(isUndefinedOrEmpty(goodsName)){
        goodsName = shelfItem.GOODS_NAME
        emptyValue.push('goodsName')
    }else{
        goodsName = goodsName.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
        if(goodsName.length > 100) {
            goodsName = goodsName.substring(0,100);
            logger.info('GoodsName is too long.')
        }
    }
    return goodsName;
}

exports.validateDetailGoodsCate = function(goodsCate, emptyValue, cate) {
    if(isUndefinedOrEmpty(goodsCate)){
        goodsCate = cate
        emptyValue.push('goodsCate')
    }else{
        goodsCate = '(#M)' + goodsCate.replaceAll(/\s+/gm, '').replaceAll(/\D+/gm, '');
    }
    return goodsCate;
}

exports.validateDetailAddInfo = function(addInfo, emptyValue) {
    if(isUndefinedOrEmpty(addInfo)){
        addInfo = 0
        emptyValue.push('addInfo')
    }else{
        if(addInfo.length > 5000) {

            logger.info('AddInfo is too long.')
        }
    }
    return addInfo;
}

function isUndefinedOrEmpty (value){
    if( value == "" || value == null || value == undefined 
        || ( value != null && typeof value == "object" && !Object.keys(value).length ) ){
        return true
    }else{
        return false
    }
}