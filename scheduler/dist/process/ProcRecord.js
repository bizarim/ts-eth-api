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
const Logger_1 = require("../middleware/Logger");
class ProcRecord {
    constructor(height, trans) {
        this.height = height;
        this.trans = trans;
        this.logger = new Logger_1.Logger();
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.run();
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
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
            // 트랜잭션 해석 하기
            const snalysis = [];
            const address = [];
            for (let i = 0; i < this.trans.length; ++i) {
                // deposit
                if (null !== this.trans[i].to && null !== this.trans[i].from) {
                    let mainAddr = this.trans[i].to;
                    mainAddr = mainAddr.toLowerCase();
                    const subAddr = this.trans[i].from.toLowerCase();
                    snalysis.push({ txid: this.trans[i].hash.toLowerCase(), direc: wallet_api_eth_common_1.eHistory.deposit, mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                    address.push(mainAddr);
                }
                // withdraw
                if (null !== this.trans[i].to && null !== this.trans[i].from) {
                    const mainAddr = this.trans[i].from.toLowerCase();
                    let subAddr = this.trans[i].to;
                    subAddr = subAddr.toLowerCase();
                    snalysis.push({ txid: this.trans[i].hash.toLowerCase(), direc: wallet_api_eth_common_1.eHistory.withraw, mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                    address.push(mainAddr);
                }
            }
            // 트랜잭션에서 관리되는 주소 걸러 내기
            const addressRepository = typeorm_1.getRepository(wallet_eth_repository_1.Address);
            const hasAddressList = yield addressRepository.find({ address: typeorm_1.In(address) });
            const depositList = [];
            const withdrawList = [];
            for (let i = 0; i < hasAddressList.length; ++i) {
                for (let j = 0; j < snalysis.length; ++j) {
                    if (snalysis[j].mainAddr.toLowerCase() == hasAddressList[i].address.toLowerCase()) {
                        snalysis[j].walletId = hasAddressList[i].walletId;
                        // 입출금 구분하기
                        if (snalysis[j].direc === wallet_api_eth_common_1.eHistory.deposit)
                            depositList.push(snalysis[j]);
                        else
                            withdrawList.push(snalysis[j]);
                    }
                }
            }
            // 입금 확인 처리
            this.logger.info(`height: ${this.height}, deposit: ` + JSON.stringify(depositList));
            for (let i = 0; i < depositList.length; ++i) {
                yield typeorm_1.getManager().transaction((trManager) => __awaiter(this, void 0, void 0, function* () {
                    const balance = yield trManager
                        .createQueryBuilder(wallet_eth_repository_1.Balance, 'balance')
                        .setLock('pessimistic_write')
                        .where('balance.walletId = :id', { id: depositList[i].walletId })
                        .andWhere('balance.coin = :coin', { coin: wallet_api_eth_common_1.eCoin.eth })
                        .getOne();
                    if (undefined === balance)
                        throw new wallet_api_eth_common_1.UndefiendEntityException();
                    balance.amount = wallet_api_eth_common_1.EthUtill.add(balance.amount, balance.unit, depositList[i].amount, depositList[i].unit).toString();
                    const history = new wallet_eth_repository_1.History();
                    history.walletId = depositList[i].walletId;
                    history.coin = wallet_api_eth_common_1.eCoin.eth;
                    history.type = wallet_api_eth_common_1.eHistory.deposit;
                    history.toFrom = depositList[i].subAddr;
                    history.unit = depositList[i].unit;
                    history.amount = depositList[i].amount;
                    history.fee = '0';
                    history.commission = '0';
                    history.state = wallet_api_eth_common_1.eState.confirm;
                    history.transactionId = depositList[i].txid;
                    yield trManager.save(balance);
                    yield trManager.save(history);
                }));
            }
            // 출금 확인 처리
            this.logger.info(`height: ${this.height}, withdraw: ` + JSON.stringify(withdrawList));
            const historyRepository = typeorm_1.getRepository(wallet_eth_repository_1.History);
            for (let i = 0; i < withdrawList.length; ++i) {
                const history = new wallet_eth_repository_1.History();
                history.walletId = withdrawList[i].walletId;
                history.coin = wallet_api_eth_common_1.eCoin.eth;
                history.type = wallet_api_eth_common_1.eHistory.withraw;
                history.toFrom = withdrawList[i].subAddr;
                history.unit = withdrawList[i].unit;
                history.amount = withdrawList[i].amount;
                history.fee = '0';
                history.commission = '0';
                history.state = wallet_api_eth_common_1.eState.confirm;
                history.transactionId = withdrawList[i].txid;
                yield historyRepository.save(history);
            }
        });
    }
}
exports.ProcRecord = ProcRecord;
class Analysis {
}
exports.Analysis = Analysis;
//# sourceMappingURL=ProcRecord.js.map