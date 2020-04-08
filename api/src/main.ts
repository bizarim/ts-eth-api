import 'reflect-metadata';
import express from 'express';
import { Container } from 'typedi';
import { useContainer as typeormUseContainer, createConnection } from 'typeorm';
import { useExpressServer, useContainer as routingUseContainer } from 'routing-controllers';
import { eCoin, ConfigLoader, MainPath, Cryptocurrency, eConfig, DbConfig, ServerConfig } from 'wallet-api-eth-common';
import { getEntityPath } from 'wallet-eth-repository';
import { WalletController } from './controller/WalletController';
import { ErrorHandler } from './middleware/ErrorHandler';
import { StartAt, EndAt } from './middleware/Interceptor';
import { Logger } from './middleware/Logger';

MainPath.set(__dirname);
Cryptocurrency.set(eCoin.eth);

typeormUseContainer(Container);
routingUseContainer(Container);

const loader = new ConfigLoader(MainPath.get(), 'config');
const dbConfig = loader.get<DbConfig>(eConfig.db);
const serverConfig = loader.get<ServerConfig>(eConfig.server);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const port = serverConfig.port;

useExpressServer(app, {
    cors: true,
    controllers: [WalletController],
    middlewares: [StartAt, EndAt, ErrorHandler],
    classTransformer: true,
    validation: true,
    development: true,
    defaultErrorHandler: true
});

createConnection({
    type: 'mysql',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [
        getEntityPath()
    ],
    synchronize: dbConfig.synchronize,
    logging: dbConfig.logging,
}).then(async connection => {
    const logger = new Logger();
    await logger.initialize();
    app.listen(port, () => {
        logger.info('env ' + process.env.NODE_ENV);
        logger.info('User service listening on port ' + port);
    });
}).catch(error => console.log(error));