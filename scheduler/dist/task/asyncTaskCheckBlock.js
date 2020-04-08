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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const sequential_task_queue_1 = require("sequential-task-queue");
const Logger_1 = require("../middleware/Logger");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const typeorm_1 = require("typeorm");
const wallet_eth_repository_1 = require("wallet-eth-repository");
const ProcRecord_1 = require("../process/ProcRecord");
const queue = new sequential_task_queue_1.SequentialTaskQueue();
const logger = new Logger_1.Logger();
let loader;
let config;
let web3;
let isSyncing;
function asyncTaskCheckBlock() {
    loader = new wallet_api_eth_common_1.ConfigLoader(wallet_api_eth_common_1.MainPath.get(), 'config');
    config = loader.get(wallet_api_eth_common_1.eConfig.web3);
    web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(config.infura.ep));
    console.log('web3 init');
    console.log('ws: ' + config.fastnode.ws);
    console.log('endpoint: ' + config.fastnode.ep);
    // 마지막 업데이트 시간
    let lastUpdate = new Date();
    let lastBlock = 0;
    // 유효블럭 설정
    const confirms = 10;
    return () => {
        // 코드가 우아하지 않다.!!
        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        // 5분에 한번씩 call
        // mainnet infura에 조금이나마 적게 호출 하기 위해서
        if (diffMins < 5)
            return;
        if (isSyncing === true)
            return;
        isSyncing = true;
        // 비동기 큐
        queue.push(() => __awaiter(this, void 0, void 0, function* () {
            // logger.info('async task Check Block-s');
            try {
                const coin = wallet_api_eth_common_1.Cryptocurrency.get();
                const blockNumber = yield web3.eth.getBlockNumber();
                const syncedBlockRepository = typeorm_1.getRepository(wallet_eth_repository_1.SyncedBlock);
                let dbSyncedBlock = yield syncedBlockRepository.findOne({ coin: coin });
                if (dbSyncedBlock === undefined) {
                    const abc = new wallet_eth_repository_1.SyncedBlock();
                    abc.coin = coin;
                    abc.height = blockNumber;
                    dbSyncedBlock = yield syncedBlockRepository.save(abc);
                }
                // 마지막 기록된 블럭 높이
                lastBlock = dbSyncedBlock.height;
                // 유효블럭 체크
                if ((blockNumber - confirms) < lastBlock) {
                    isSyncing = false;
                    // lastUpdate = new Date();
                    return;
                }
                logger.info(`async task Check Block-${dbSyncedBlock.height < blockNumber}: ${dbSyncedBlock.height},  ${blockNumber}`);
                // 기록 프레세스
                if (dbSyncedBlock.height < blockNumber) {
                    ++dbSyncedBlock.height;
                    for (let i = dbSyncedBlock.height; i <= blockNumber; ++i) {
                        let getBlockCbError;
                        const block = yield web3.eth.getBlock(i, true, (err, b) => {
                            getBlockCbError = err;
                            logger.info('!= getBlock =!:' + JSON.stringify(err));
                            logger.info('block height: ' + JSON.stringify(i));
                            // logger.info('block: ' + JSON.stringify(b));
                        });
                        if (getBlockCbError === undefined)
                            continue;
                        if (getBlockCbError !== null || block === null)
                            continue;
                        // 트랜잭션 적용 및 기록
                        yield new ProcRecord_1.ProcRecord(i, block.transactions).execute();
                        dbSyncedBlock.height = i;
                        // 블럭 높이 기록
                        yield syncedBlockRepository.save(dbSyncedBlock);
                    }
                }
                logger.info('async task Check Block-e');
            }
            catch (e) {
                logger.info('asyncTaskCheckBlock err: ' + JSON.stringify(e.message));
                logger.info('asyncTaskCheckBlock err: ' + JSON.stringify(e.stack));
            }
            finally {
                isSyncing = false;
                lastUpdate = new Date();
            }
        }));
    };
}
exports.asyncTaskCheckBlock = asyncTaskCheckBlock;
//# sourceMappingURL=asyncTaskCheckBlock.js.map