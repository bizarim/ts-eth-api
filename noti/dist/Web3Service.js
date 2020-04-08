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
const ws_1 = __importDefault(require("ws"));
const sequential_task_queue_1 = require("sequential-task-queue");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const web3_1 = __importDefault(require("web3"));
const ProcRecord_1 = require("./process/ProcRecord");
const Logger_1 = require("./Logger");
const queue = new sequential_task_queue_1.SequentialTaskQueue();
class Web3Service {
    constructor() {
        this.init = false;
        this.logger = new Logger_1.Logger();
        if (false === this.init) {
            const loader = new wallet_api_eth_common_1.ConfigLoader(wallet_api_eth_common_1.MainPath.get(), 'config');
            const config = loader.get(wallet_api_eth_common_1.eConfig.web3);
            console.log('ws: ' + config.fastnode.ws);
            console.log('endpoint: ' + config.fastnode.ep);
            this.ws = new ws_1.default(config.fastnode.ws);
            this.web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(config.fastnode.ep));
            this.init = true;
        }
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return 'test';
        });
    }
    sub() {
        return __awaiter(this, void 0, void 0, function* () {
            const subscriptionNewHeads = {
                id: 1,
                method: 'eth_subscribe',
                params: ['newHeads']
            };
            this.ws.onopen = () => {
                // 구독하기
                this.ws.send(JSON.stringify(subscriptionNewHeads));
                // ws.send(JSON.stringify(subscriptionNewPendingTransactionss));
            };
            this.ws.onmessage = (ack) => {
                // console.log(blockHeader);
                queue.push(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // console.log(ack);
                        // console.log(typeof ack.data);
                        // console.log(ack.data);
                        const context = JSON.parse(ack.data);
                        if (typeof context.params === 'undefined')
                            return;
                        if (typeof context.params.result === 'undefined')
                            return;
                        if (typeof context.params.result.hash === 'undefined')
                            return;
                        console.log('!= newBlockHeaders =!');
                        console.log(context.params.result.number);
                        console.log(context.params.result.hash);
                        let cbError;
                        const block = yield this.web3.eth.getBlock(context.params.result.hash, true, (err, b) => {
                            console.log('!= getBlock =!');
                            this.logger.info(JSON.stringify(err));
                            this.logger.info(JSON.stringify(b));
                            cbError = err;
                        });
                        if (cbError === undefined)
                            return;
                        if (cbError !== null)
                            return;
                        if (block === null)
                            return;
                        new ProcRecord_1.ProcRecord(block.transactions).execute();
                    }
                    catch (e) {
                        this.logger.error(JSON.stringify(e));
                        console.log(e);
                    }
                }));
            };
            this.ws.onerror = (e) => {
                this.logger.error(e.message);
                console.log(e.message);
            };
            return 'test';
        });
    }
}
exports.Web3Service = Web3Service;
//# sourceMappingURL=Web3Service.js.map