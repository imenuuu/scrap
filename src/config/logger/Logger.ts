import type {Logger} from "winston";

const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
const moment = require('moment')
const winstonDaily = require('winston-daily-rotate-file')

const env = process.env.NODE_ENV || 'development';
const logDir = './logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger: Logger = createLogger({
  level: env === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.label({ label: path.basename(process.mainModule.filename) }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          info =>
            `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        )
      )
    }),
    
    new (winstonDaily)({
      filename: './logs/puppeteer-%DATE%.log',
      datePattern:'YYYY-MM-DD',
      colorize: false,
      maxsize: '20m',
      maxFiles: '14d',
      level: 'info',
      showLevel: true,
      json: true,
      format: format.combine(
        format.printf(
          info =>
          `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        )
      )
    })
  ]
});


export {logger}