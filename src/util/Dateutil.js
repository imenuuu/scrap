const moment = require('moment');

// return yyyy-mm-dd hh:mm:ss
exports.currentDate = function() {
    const today = moment().format('YYYY-MM-DD HH:mm:ss');
    // let today = new Date().toISOString();
    // today = today.replace(/T/, ' ');
    // today = today.replace(/\..+/, '');
    return today;
}

// return yyyy-mm-dd
exports.currentDay = function(){
    const today = moment().format('YYYY-MM-DD');
    return today;
}

// return yyyymmdd
exports.collectDay = function(){
    const today = moment().format('YYYYMMDD');
    return today;
}

exports.expiredDt = function () {
    const expired_dt = moment().add(7, 'd').format('YYYY-MM-DD HH:mm:ss');
    return expired_dt;
}