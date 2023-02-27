const moment = require('moment');

// return yyyy-mm-dd hh:mm:ss
function currentDate() {
    const today = moment().format('YYYY-MM-DD HH:mm:ss');
    // let today = new Date().toISOString();
    // today = today.replace(/T/, ' ');
    // today = today.replace(/\..+/, '');
    return today;
}

// return yyyy-mm-dd
function currentDay() {
    const today = moment().format('YYYY-MM-DD');
    return today;
}

// return yyyymmdd
function collectDay() {
    const today = moment().format('YYYYMMDD');
    return today;
}

function expiredDt() {
    const expired_dt = moment().add(7, 'd').format('YYYY-MM-DD HH:mm:ss');
    return expired_dt;
}

export {currentDate, currentDay, collectDay, expiredDt}