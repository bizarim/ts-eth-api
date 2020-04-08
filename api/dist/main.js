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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typedi_1 = require("typedi");
const typeorm_1 = require("typeorm");
const routing_controllers_1 = require("routing-controllers");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const wallet_eth_repository_1 = require("wallet-eth-repository");
const WalletController_1 = require("./controller/WalletController");
const ErrorHandler_1 = require("./middleware/ErrorHandler");
const Interceptor_1 = require("./middleware/Interceptor");
const Logger_1 = require("./middleware/Logger");
wallet_api_eth_common_1.MainPath.set(__dirname);
wallet_api_eth_common_1.Cryptocurrency.set(wallet_api_eth_common_1.eCoin.eth);
typeorm_1.useContainer(typedi_1.Container);
routing_controllers_1.useContainer(typedi_1.Container);
const loader = new wallet_api_eth_common_1.ConfigLoader(wallet_api_eth_common_1.MainPath.get(), 'config');
const dbConfig = loader.get(wallet_api_eth_common_1.eConfig.db);
const serverConfig = loader.get(wallet_api_eth_common_1.eConfig.server);
const port = serverConfig.port;
const app = routing_controllers_1.createExpressServer({
    cors: true,
    controllers: [WalletController_1.WalletController],
    middlewares: [Interceptor_1.StartAt, Interceptor_1.EndAt, ErrorHandler_1.ErrorHandler],
    classTransformer: true,
    validation: true,
    development: true,
    defaultErrorHandler: true
});
typeorm_1.createConnection({
    type: 'mysql',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [
        wallet_eth_repository_1.getEntityPath()
    ],
    synchronize: dbConfig.synchronize,
    logging: dbConfig.logging,
}).then((connection) => __awaiter(void 0, void 0, void 0, function* () {
    const logger = new Logger_1.Logger();
    yield logger.initialize();
    app.listen(port, () => {
        logger.info('env ' + process.env.NODE_ENV);
        logger.info('User service listening on port ' + port);
    });
})).catch(error => console.log(error));
//# sourceMappingURL=main.js.map