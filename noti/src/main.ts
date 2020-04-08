import { Container } from 'typedi';
import { useContainer as typeormUseContainer, createConnection } from 'typeorm';
import { MainPath, Cryptocurrency, eCoin, ConfigLoader, DbConfig, eConfig } from 'wallet-api-eth-common';
import { Web3Service } from './Web3Service';
import { getEntityPath } from 'wallet-eth-repository';
import { Logger } from './Logger';

MainPath.set(__dirname);
Cryptocurrency.set(eCoin.eth);

typeormUseContainer(Container);

const loader = new ConfigLoader(MainPath.get(), 'config');
const dbConfig = loader.get<DbConfig>(eConfig.db);

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
    const web = new Web3Service();
    web.sub();
    logger.info('noti on');
}).catch(error => console.log(error));