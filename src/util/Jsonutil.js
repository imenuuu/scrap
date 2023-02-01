exports.strToJson = function(jsonString){
    return JSON.parse(jsonString);
}

exports.jsonToStr = function(key){
    return JSON.stringify(key);    
}

exports.jsonPathAccess = function(jsonObject, key) {
    
    let keyList = key.split(".");
    let tempObj = jsonObject;
    if(keyList.length > 0) {
        let res;
        for(var key of keyList){
            res = tempObj[key];
            tempObj = res;
        }
        return res;
    } else {
        return jsonObject.key;
    }
}
