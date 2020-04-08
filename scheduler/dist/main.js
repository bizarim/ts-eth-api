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
Object.defineProperty(exports, "__esModule", { value: true });
const cron = __importStar(require("node-cron"));
const typedi_1 = require("typedi");
const typeorm_1 = require("typeorm");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const wallet_eth_repository_1 = require("wallet-eth-repository");
const Logger_1 = require("./middleware/Logger");
const asyncTaskCheckBlock_1 = require("./task/asyncTaskCheckBlock");
wallet_api_eth_common_1.MainPath.set(__dirname);
wallet_api_eth_common_1.Cryptocurrency.set(wallet_api_eth_common_1.eCoin.eth);
typeorm_1.useContainer(typedi_1.Container);
const loader = new wallet_api_eth_common_1.ConfigLoader(wallet_api_eth_common_1.MainPath.get(), 'config');
const dbConfig = loader.get(wallet_api_eth_common_1.eConfig.db);
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
    logger.info('scheduler on');
    const taskCheckBlock = cron.schedule('*/10 * * * * * *', asyncTaskCheckBlock_1.asyncTaskCheckBlock());
    taskCheckBlock.start();
})).catch(error => console.log(error));
//# sourceMappingURL=main.js.map