"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const typedi_1 = require("typedi");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const wallet_eth_repository_1 = require("wallet-eth-repository");
const typeorm_1 = require("typeorm");
const Logger_1 = require("../middleware/Logger");
let RepositoryService = class RepositoryService {
    constructor() {
        this.logger = new Logger_1.Logger();
    }
    /**
     * 기업 주소 지갑 정보 얻기
     * @param coin 암호화폐
     */
    hasEnterpirseWallet(coin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const walletRepository = typeorm_1.getRepository(wallet_eth_repository_1.Wallet);
                const enterpise = yield walletRepository
                    .findOne({ role: wallet_api_eth_common_1.eRole.enterprise }, { relations: ['address', 'balance'] });
                if (undefined === enterpise) {
                    return { error: wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress };
                }
                const etherAddress = enterpise
                    .address
                    .find(o => o.coin === coin);
                if (undefined === etherAddress) {
                    return { error: wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress };
                }
                const etherBalance = enterpise
                    .balance
                    .find(o => o.coin === coin);
                if (undefined === etherBalance) {
                    return { error: wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress };
                }
                return {
                    error: wallet_api_eth_common_1.eErrorCode.Success,
                    result: {
                        id: enterpise.id, uuid: enterpise.uuid,
                        address: { coin: etherAddress.coin, privateKey: etherAddress.privateKey, address: etherAddress.address },
                        balance: { coin: etherBalance.coin, amount: etherBalance.amount, unit: etherBalance.unit }
                    }
                };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
    /**
     * uuid로 지갑 정보 얻기
     * @param uuid 고유번호
     * @param coin 암호화폐
     */
    hasWalletByUUID(uuid, coin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const walletRepository = typeorm_1.getRepository(wallet_eth_repository_1.Wallet);
                const member = yield walletRepository
                    .findOne({ uuid: uuid }, { relations: ['address', 'balance'] });
                if (undefined === member) {
                    return { error: wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress };
                }
                const etherAddress = member
                    .address
                    .find(o => o.coin === coin);
                if (undefined === etherAddress) {
                    return { error: wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress };
                }
                const etherBalance = member
                    .balance
                    .find(o => o.coin === coin);
                if (undefined === etherBalance) {
                    return { error: wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress };
                }
                return {
                    error: wallet_api_eth_common_1.eErrorCode.Success,
                    result: {
                        id: member.id, uuid: member.uuid,
                        address: { coin: etherAddress.coin, privateKey: etherAddress.privateKey, address: etherAddress.address },
                        balance: { coin: etherBalance.coin, amount: etherBalance.amount, unit: etherBalance.unit }
                    }
                };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
    /**
     * 주소 등록
     * @param coin 암호화폐
     * @param role 롤
     * @param address 주소
     * @param privateKey 프라이빗 키
     * @param uuid 고유번호
     */
    register(coin, role, address, privateKey, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const walletRepository = typeorm_1.getRepository(wallet_eth_repository_1.Wallet);
                let wallet = yield walletRepository
                    .findOne({ uuid: uuid }, { relations: ['address', 'balance'] });
                if (undefined !== wallet) {
                    return { error: wallet_api_eth_common_1.eErrorCode.AlreadyHasEthAddress };
                }
                wallet = new wallet_eth_repository_1.Wallet();
                wallet.uuid = uuid;
                wallet.role = role;
                wallet.address = [];
                wallet.balance = [];
                wallet.address.push({ coin: coin, privateKey: privateKey, address: address });
                wallet.balance.push({ amount: '0', coin: coin });
                yield walletRepository.save(wallet);
                return { error: wallet_api_eth_common_1.eErrorCode.Success };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
    /**
     * 출금 취소
     * @param token 토큰
     * @param book 기록지
     */
    recordWithrawCancel(token, book) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield typeorm_1.getManager().transaction((trManager) => __awaiter(this, void 0, void 0, function* () {
                    const withdraw = yield trManager
                        .createQueryBuilder(wallet_eth_repository_1.Withdraw, 'withdraw')
                        .setLock('pessimistic_write')
                        .where('withdraw.token = :token', { token: token })
                        .getOne();
                    if (undefined === withdraw)
                        throw new wallet_api_eth_common_1.UndefiendEntityException();
                    const history = new wallet_eth_repository_1.History();
                    history.walletId = book.walletId;
                    history.coin = book.coin;
                    history.type = book.type;
                    history.toFrom = book.toFrom;
                    history.unit = book.unit;
                    history.amount = book.amount;
                    history.fee = book.fee;
                    history.commission = book.commission;
                    history.state = book.state;
                    const dbHistory = yield trManager.save(history);
                    book.historyId = dbHistory.id;
                    yield trManager.save(withdraw);
                }));
                return { error: wallet_api_eth_common_1.eErrorCode.Success, result: book };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
    /**
     * 출금 요청 pending 상태
     * @param token 토큰
     * @param book 기록지
     */
    recordWithrawRequest(token, book) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield typeorm_1.getManager().transaction((trManager) => __awaiter(this, void 0, void 0, function* () {
                    const withdraw = yield trManager
                        .createQueryBuilder(wallet_eth_repository_1.Withdraw, 'withdraw')
                        .setLock('pessimistic_write')
                        .where('withdraw.token = :token', { token: token })
                        .getOne();
                    if (undefined === withdraw)
                        throw new wallet_api_eth_common_1.UndefiendEntityException();
                    const balance = yield trManager
                        .createQueryBuilder(wallet_eth_repository_1.Balance, 'balance')
                        .setLock('pessimistic_write')
                        .where('balance.walletId = :id', { id: book.walletId })
                        .andWhere('balance.coin = :coin', { coin: book.coin })
                        .getOne();
                    if (undefined === balance)
                        throw new wallet_api_eth_common_1.UndefiendEntityException();
                    if (true === wallet_api_eth_common_1.EthUtill.isLessThan(balance.amount, wallet_api_eth_common_1.EtherDefaultUnit, book.total, book.unit))
                        throw new wallet_api_eth_common_1.CalcLessThanException();
                    // update balance
                    balance.amount = wallet_api_eth_common_1.EthUtill.sub(balance.amount, balance.unit, book.total, book.unit).toString();
                    // insert history
                    const history = new wallet_eth_repository_1.History();
                    history.transactionId = book.txid;
                    history.walletId = book.walletId;
                    history.coin = book.coin;
                    history.type = book.type;
                    history.toFrom = book.toFrom;
                    history.unit = book.unit;
                    history.amount = book.amount;
                    history.fee = book.fee;
                    history.commission = book.commission;
                    history.state = book.state;
                    // update withdraw
                    withdraw.state = wallet_api_eth_common_1.eWithdraw.completed;
                    yield trManager.save(balance);
                    yield trManager.save(history);
                    yield trManager.save(withdraw);
                }));
                return { error: wallet_api_eth_common_1.eErrorCode.Success };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
    /**
     * 거래 히스토리 요청
     * @param uuid 고유번호
     * @param coin 암호화폐
     * @param type 입출금 타입
     * @param offset 개수
     * @param page 페이지
     */
    getHistory(uuid, coin, type, offset, page) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sum = yield typeorm_1.getConnection()
                    .createQueryBuilder()
                    .select('hitstory.id', 'id')
                    .from(wallet_eth_repository_1.History, 'history')
                    .leftJoin(wallet_eth_repository_1.Wallet, 'wallet', 'history.walletId = wallet.id')
                    .where('wallet.uuid=:uuid', { uuid: uuid })
                    .where('history.coin=:coin', { coin: coin })
                    .getCount();
                const curType1 = type === undefined ? wallet_api_eth_common_1.eHistory.deposit : type;
                const curType2 = type === undefined ? wallet_api_eth_common_1.eHistory.withraw : type;
                const curOffset = offset === undefined ? 10 : offset;
                let curPage = page === undefined ? 1 : page;
                const totPage = Math.floor(sum / curOffset) + 1;
                curPage = curPage < 0 ? 1 : curPage;
                curPage = totPage < curPage ? totPage : curPage;
                const rt = yield typeorm_1.getConnection()
                    .createQueryBuilder()
                    .select('history')
                    .from(wallet_eth_repository_1.History, 'history')
                    .leftJoin(wallet_eth_repository_1.Wallet, 'wallet', 'history.walletId = wallet.id')
                    .where('wallet.uuid=:uuid AND history.coin=:coin AND (history.type=:type1 OR history.type=:type2)', { uuid: uuid, coin: coin, type1: curType1, type2: curType2 })
                    .orderBy('history.id', 'DESC')
                    .skip((curPage - 1) * curOffset)
                    .take(curOffset)
                    .getMany();
                return { error: wallet_api_eth_common_1.eErrorCode.Success, result: { list: rt, totPage: totPage, curPage: curPage, totCnt: sum } };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
    /**
     * 출금 준비단계 얻어오기
     * @param coin 암호화폐
     * @param uuid 요청자 고유번호
     * @param token 토큰
     */
    getPreparedWithraw(token) {
        return __awaiter(this, void 0, void 0, function* () {
            let error = wallet_api_eth_common_1.eErrorCode.DbError;
            try {
                let dbWithdraw = undefined;
                yield typeorm_1.getManager().transaction((trManager) => __awaiter(this, void 0, void 0, function* () {
                    const withdraw = yield trManager
                        .createQueryBuilder(wallet_eth_repository_1.Withdraw, 'withdraw')
                        .setLock('pessimistic_write')
                        .where('withdraw.token = :token', { token: token })
                        .getOne();
                    if (undefined === withdraw) {
                        error = wallet_api_eth_common_1.eErrorCode.NoneExistWithdrawToken;
                        throw new Error('NoneExistWithdrawToken');
                    }
                    if (withdraw.state !== wallet_api_eth_common_1.eWithdraw.request) {
                        error = wallet_api_eth_common_1.eErrorCode.InvalidWithdrawToken;
                        throw new Error('InvalidWithdrawToken');
                    }
                    withdraw.state = wallet_api_eth_common_1.eWithdraw.prepared;
                    dbWithdraw = yield trManager.save(withdraw);
                }));
                if (undefined === dbWithdraw) {
                    return { error: wallet_api_eth_common_1.eErrorCode.DbError };
                }
                dbWithdraw = dbWithdraw;
                return {
                    error: wallet_api_eth_common_1.eErrorCode.Success,
                    result: {
                        uuid: dbWithdraw.requester,
                        amount: dbWithdraw.amount,
                        unit: dbWithdraw.unit,
                        to: dbWithdraw.to
                    }
                };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: error };
            }
        });
    }
    setPreparedWithraw(coin, walletId, uuid, amount, unit, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const withdrawRepository = typeorm_1.getRepository(wallet_eth_repository_1.Withdraw);
                const withdraw = new wallet_eth_repository_1.Withdraw();
                withdraw.coin = coin;
                withdraw.walletId = walletId;
                withdraw.requester = uuid;
                withdraw.to = to;
                withdraw.amount = amount;
                withdraw.unit = unit;
                withdraw.token = wallet_api_eth_common_1.makeUUID();
                withdraw.state = wallet_api_eth_common_1.eWithdraw.request;
                yield withdrawRepository.save(withdraw);
                return { error: wallet_api_eth_common_1.eErrorCode.Success, result: withdraw.token };
            }
            catch (e) {
                if (e instanceof Error) {
                    this.logger.error(JSON.stringify(e.message));
                    this.logger.error(JSON.stringify(e.stack));
                }
                else {
                    this.logger.error(JSON.stringify(e));
                }
                return { error: wallet_api_eth_common_1.eErrorCode.DbError };
            }
        });
    }
};
RepositoryService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], RepositoryService);
exports.RepositoryService = RepositoryService;
//# sourceMappingURL=RepositoryService.js.map