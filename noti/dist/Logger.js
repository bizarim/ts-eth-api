"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const winston = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
class Logger {
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (undefined === Logger.logger) {
                this.loader = new wallet_api_eth_common_1.ConfigLoader(wallet_api_eth_common_1.MainPath.get(), 'config');
                const config = this.loader.get(wallet_api_eth_common_1.eConfig.server);
                Logger.logger = createLogger(config);
            }
            else {
                console.log('logger already initialize !!!!');
            }
        });
    }
    log(level, message, ...meta) {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            if (undefined === message)
                Logger.logger.log(level);
            else
                Logger.logger.log(level, message);
        }
        else
            Logger.logger.log(level, message, meta);
    }
    error(message, ...meta) {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.error, message);
        }
        else {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.error, message, meta);
        }
    }
    debug(message, ...meta) {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.debug, message);
        }
        else {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.debug, message, meta);
        }
    }
    info(message, ...meta) {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.info, message);
        }
        else {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.info, message, meta);
        }
    }
    warn(message, ...meta) {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.warn, message);
        }
        else {
            Logger.logger.log(wallet_api_eth_common_1.eLogLevel.warn, message, meta);
        }
    }
}
exports.Logger = Logger;
/**
 * winston 로거 생성
 */
function createLogger(config) {
    const numCPUs = os.cpus().length;
    const logMaxSize = parseFloat((2048 / numCPUs).toFixed()) * 1000 * 100; // 용량 제한 102400 => 100 kb, 102400000 => 100mb, 10240000 => 10mb
    // let logDir = '/home/logs'// config.logPath
    const name = config.name; // config.name
    const level = config.logLevel;
    const logDir = config.logPath; // config.logPath
    // create log directory
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const options = {
        level: 'debug',
        format: winston.format.combine(
        // winston.format.json(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston.format.printf((info) => `${info.timestamp} [${info.level}] - ${info.message}`)),
        // logger setting
        transports: [
            // console setting
            new winston.transports.Console({ level: level }),
            new winston_daily_rotate_file_1.default({
                level: 'debug',
                filename: `${logDir}/log/${name}_%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxSize: logMaxSize
            })
        ],
        // uncaughtException 발생시 처리
        exceptionHandlers: [
            new winston.transports.Console(),
            new winston_daily_rotate_file_1.default({
                level: 'debug',
                filename: `${logDir}/exception/ex_${name}_%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxSize: logMaxSize
            })
        ]
    };
    // logger
    const logger = winston.createLogger(options);
    // console.log(numCPUs);
    // console.log(logMaxSize);
    logger.debug('pid: ' + process.pid + ' numCPUs: ' + numCPUs);
    logger.debug('pid: ' + process.pid + ' logMaxSize: ' + logMaxSize);
    return logger;
}
exports.createLogger = createLogger;
//# sourceMappingURL=Logger.js.map