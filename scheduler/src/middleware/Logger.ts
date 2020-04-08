import * as os from 'os';
import * as fs from 'fs';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ILogger, eLogLevel, ConfigLoader, MainPath, eConfig, ServerConfig } from 'wallet-api-eth-common';

export class Logger {

    private static logger?: ILogger;
    protected loader: ConfigLoader;

    async initialize(): Promise<void> {
        if (undefined === Logger.logger) {
            this.loader = new ConfigLoader(MainPath.get(), 'config');
            const config = this.loader.get<ServerConfig>(eConfig.server);
            Logger.logger = createLogger(config);
        } else {
            console.log('logger already initialize !!!!');
        }
    }

    public log(level: eLogLevel, message?: string, ...meta: any[]): void {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            if (undefined === message) Logger.logger.log(level);
            else Logger.logger.log(level, message);
        }
        else Logger.logger.log(level, message as string, meta);
    }

    public error(message: string, ...meta: any[]): void {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(eLogLevel.error, message);
        } else {
            Logger.logger.log(eLogLevel.error, message, meta);
        }
    }

    public debug(message: string, ...meta: any[]): void {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(eLogLevel.debug, message);
        } else {
            Logger.logger.log(eLogLevel.debug, message, meta);
        }
    }

    public info(message: string, ...meta: any[]): void {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(eLogLevel.info, message);
        } else {
            Logger.logger.log(eLogLevel.info, message, meta);
        }
    }

    public warn(message: string, ...meta: any[]): void {
        if (undefined === Logger.logger) {
            console.log('logger not initialize !!!!');
            return;
        }
        if (meta.length < 1) {
            Logger.logger.log(eLogLevel.warn, message);
        } else {
            Logger.logger.log(eLogLevel.warn, message, meta);
        }
    }


}


/**
 * winston 로거 생성
 */
export function createLogger(config: ServerConfig): ILogger {

    const numCPUs: number = os.cpus().length;
    const logMaxSize: number = parseFloat((2048 / numCPUs).toFixed()) * 1000 * 100;     // 용량 제한 102400 => 100 kb, 102400000 => 100mb, 10240000 => 10mb


    // let logDir = '/home/logs'// config.logPath
    const name = config.name; // config.name
    const level = config.logLevel;
    const logDir = config.logPath; // config.logPath

    // create log directory
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const options: winston.LoggerOptions = {
        level: 'debug',
        format: winston.format.combine(
            // winston.format.json(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.printf((info) => `${info.timestamp} [${info.level}] - ${info.message}`)
        ),
        // logger setting
        transports: [
            // console setting
            new winston.transports.Console({ level: level }),
            new DailyRotateFile({
                level: 'debug',      // 로그 레벨 지정
                filename: `${logDir}/log/${name}_%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxSize: logMaxSize
            })
        ],
        // uncaughtException 발생시 처리
        exceptionHandlers: [
            new winston.transports.Console(),
            new DailyRotateFile({
                level: 'debug',
                filename: `${logDir}/exception/ex_${name}_%DATE%.log`,
                datePattern: 'YYYY-MM-DD',  // 시간 별로 파일을 다르게 남길지 고민해 보자.
                maxSize: logMaxSize
            })
        ]
    };

    // logger
    const logger: ILogger = winston.createLogger(options) as ILogger;

    // console.log(numCPUs);
    // console.log(logMaxSize);
    logger.debug('pid: ' + process.pid + ' numCPUs: ' + numCPUs);
    logger.debug('pid: ' + process.pid + ' logMaxSize: ' + logMaxSize);

    return logger;
}
