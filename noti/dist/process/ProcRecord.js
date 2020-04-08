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
const typeorm_1 = require("typeorm");
const wallet_eth_repository_1 = require("wallet-eth-repository");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const Logger_1 = require("../Logger");
class ProcRecord {
    constructor(trans) {
        this.trans = trans;
        this.logger = new Logger_1.Logger();
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.run();
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (undefined === this.trans)
                return;
            if (null === this.trans)
                return;
            if (this.trans.length < 1)
                return;
            // console.log(this.trans);
            const state = [];
            const address = [];
            for (let i = 0; i < this.trans.length; ++i) {
                if (null !== this.trans[i].to && null !== this.trans[i].from) {
                    let mainAddr = this.trans[i].to;
                    mainAddr = mainAddr.toLowerCase();
                    const subAddr = this.trans[i].from.toLowerCase();
                    state.push({ txid: this.trans[i].hash.toLowerCase(), direc: 'to', mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                    address.push(mainAddr);
                }
                if (null !== this.trans[i].to && null !== this.trans[i].from) {
                    const mainAddr = this.trans[i].from.toLowerCase();
                    let subAddr = this.trans[i].to;
                    subAddr = subAddr.toLowerCase();
                    state.push({ txid: this.trans[i].hash.toLowerCase(), direc: 'from', mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                    address.push(mainAddr);
                }
            }
            // console.log(address);
            const addressRepository = typeorm_1.getRepository(wallet_eth_repository_1.Address);
            const historyRepository = typeorm_1.getRepository(wallet_eth_repository_1.History);
            // console.log(state);
            const list = yield addressRepository.find({ address: typeorm_1.In(address) });
            const strList = JSON.stringify(list);
            console.log(strList);
            this.logger.info(strList);
            const managedList = [];
            for (let i = 0; i < list.length; ++i) {
                for (let j = 0; j < state.length; ++j) {
                    // console.log(state[j].mainAddr.toLowerCase());
                    // console.log(list[i].address.toLowerCase());
                    if (state[j].mainAddr.toLowerCase() == list[i].address.toLowerCase()) {
                        state[j].walletId = list[i].walletId;
                        managedList.push(state[j]);
                    }
                }
            }
            // console.log(managedList);
            for (let i = 0; i < managedList.length; ++i) {
                if (0 === managedList[i].walletId)
                    continue;
                const dbHistory = yield historyRepository.findOne({ walletId: managedList[i].walletId, transactionId: managedList[i].txid });
                if (undefined === dbHistory) {
                    yield typeorm_1.getManager().transaction((trManager) => __awaiter(this, void 0, void 0, function* () {
                        const balance = yield trManager
                            .createQueryBuilder(wallet_eth_repository_1.Balance, 'balance')
                            .setLock('pessimistic_write')
                            .where('balance.walletId = :id', { id: managedList[i].walletId })
                            .andWhere('balance.coin = :coin', { coin: wallet_api_eth_common_1.eCoin.eth })
                            .getOne();
                        // todo custom exception
                        if (undefined === balance)
                            throw new wallet_api_eth_common_1.UndefiendEntityException();
                        balance.amount = wallet_api_eth_common_1.EthUtill.add(balance.amount, balance.unit, managedList[i].amount, managedList[i].unit).toString();
                        const history = new wallet_eth_repository_1.History();
                        history.walletId = managedList[i].walletId;
                        history.coin = wallet_api_eth_common_1.eCoin.eth;
                        history.type = wallet_api_eth_common_1.eHistory.deposit;
                        history.toFrom = managedList[i].subAddr;
                        history.unit = managedList[i].unit;
                        history.amount = managedList[i].amount;
                        history.fee = '0';
                        history.commission = '0';
                        history.state = wallet_api_eth_common_1.eState.confirm;
                        history.transactionId = managedList[i].txid;
                        yield trManager.save(balance);
                        yield trManager.save(history);
                    }));
                }
                else {
                    dbHistory.state = wallet_api_eth_common_1.eState.confirm;
                    historyRepository.save(dbHistory);
                }
            }
        });
    }
}
exports.ProcRecord = ProcRecord;
class State {
}
exports.State = State;
//# sourceMappingURL=ProcRecord.js.map