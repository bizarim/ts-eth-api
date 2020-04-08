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
const RepositoryService_1 = require("./RepositoryService");
const Web3Service_1 = require("./Web3Service");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const Logger_1 = require("../middleware/Logger");
let WalletService = class WalletService {
    constructor(repositoryService, web3Service) {
        this.repositoryService = repositoryService;
        this.web3Service = web3Service;
        this.logger = new Logger_1.Logger();
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return 'test';
        });
    }
    /**
     * 기업 회원 등록
     * @param uuid 고유번호
     */
    registerEnterprise(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // check has
            const hasLayer = yield this.repositoryService
                .hasEnterpirseWallet(coin);
            if (hasLayer.error === wallet_api_eth_common_1.eErrorCode.Success &&
                hasLayer.result !== undefined) {
                return new wallet_api_eth_common_1.Response(wallet_api_eth_common_1.eErrorCode.AlreadyHasEthAddress);
            }
            else if (hasLayer.error !== wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress) {
                return new wallet_api_eth_common_1.Response(hasLayer.error);
            }
            // create address
            const account = yield this.web3Service.create();
            const rt = account.result;
            // call repository
            const layerRepo = yield this.repositoryService
                .register(coin, wallet_api_eth_common_1.eRole.enterprise, rt.address, rt.privateKey, uuid);
            if (layerRepo.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(layerRepo.error);
            }
            return new wallet_api_eth_common_1.Response().to({ coin: coin, address: rt.address, uuid: uuid });
        });
    }
    /**
     * 일반 멤버 등록
     * @param uuid 고유번호
     */
    registerMember(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // check has
            const hasLayer = yield this.repositoryService
                .hasWalletByUUID(uuid, coin);
            if (hasLayer.error === wallet_api_eth_common_1.eErrorCode.Success &&
                hasLayer.result !== undefined) {
                return new wallet_api_eth_common_1.Response(wallet_api_eth_common_1.eErrorCode.AlreadyHasEthAddress);
            }
            else if (hasLayer.error !== wallet_api_eth_common_1.eErrorCode.NoneExistCoinAddress) {
                return new wallet_api_eth_common_1.Response(hasLayer.error);
            }
            // create address
            const account = yield this.web3Service.create();
            const rt = account.result;
            // call repository
            const layerRepo = yield this.repositoryService
                .register(coin, wallet_api_eth_common_1.eRole.member, rt.address, rt.privateKey, uuid);
            if (layerRepo.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(layerRepo.error);
            }
            return new wallet_api_eth_common_1.Response().to({ coin: coin, address: rt.address, uuid: uuid });
        });
    }
    /**
     * 잔액 조회
     *  - 입금 확인용
     * @param uuid 고유번호
     */
    getBalance(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // 만약 원장에는 처리 되지만
            // 스케쥴 서버에서 오류가 생겨 db에 반영이 안된경우
            // cs 처리 해야 한다.
            // check has
            const hasLayer = yield this.repositoryService
                .hasWalletByUUID(uuid, coin);
            if (hasLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasLayer.error);
            }
            const rt = hasLayer.result;
            // payload
            return new wallet_api_eth_common_1.Response().to({ coin: rt.balance.coin, amount: rt.balance.amount, unit: rt.balance.unit });
        });
    }
    /**
     * 주요정보 제공
     * @param uuid 고유번호
     */
    getPrimary(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // check has
            const hasLayer = yield this.repositoryService
                .hasWalletByUUID(uuid, coin);
            if (hasLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasLayer.error);
            }
            const rt = hasLayer.result;
            // payload
            return new wallet_api_eth_common_1.Response().to({ coin: rt.balance.coin, amount: rt.balance.amount, unit: rt.balance.unit, address: rt.address.address });
        });
    }
    /**
     * 입금된 암호화폐 회사 주소로 전송
     * @param uuid 고유번호
     */
    requestTransfer(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // 문제점
            // 이런 구조이면 100% 중복 처리 된다. 동시성 때문에
            // check has
            const hasEnterpirseLayer = yield this.repositoryService
                .hasEnterpirseWallet(coin);
            if (hasEnterpirseLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasEnterpirseLayer.error);
            }
            // check has
            const hasMemberLayer = yield this.repositoryService
                .hasWalletByUUID(uuid, coin);
            if (hasMemberLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasMemberLayer.error);
            }
            // amount 있는지 비교
            const enterpiseWallet = hasEnterpirseLayer.result;
            const memberWallet = hasMemberLayer.result;
            // todo 이런 부분을 없애고 싶어서 ddd를 하고 싶다.
            if (true === wallet_api_eth_common_1.EthUtill.isLessThan(memberWallet.balance.amount, memberWallet.balance.unit, '0', memberWallet.balance.unit)) {
                return new wallet_api_eth_common_1.Response(wallet_api_eth_common_1.eErrorCode.NotEnoughBalance);
            }
            // total = amount + fee
            const total = wallet_api_eth_common_1.EthUtill.toWei(memberWallet.balance.amount, memberWallet.balance.unit).toString();
            // amount
            const amount = wallet_api_eth_common_1.EthUtill.sub(memberWallet.balance.amount, memberWallet.balance.unit, this.web3Service.getFeeWei(), wallet_api_eth_common_1.EtherDefaultUnit).toString();
            // fee
            const fee = this.web3Service.getFeeWei();
            // 토큰 발급
            const rtLayer = yield this.repositoryService
                .setPreparedWithraw(coin, memberWallet.id, enterpiseWallet.uuid, memberWallet.balance.amount, memberWallet.balance.unit, enterpiseWallet.address.address);
            if (rtLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(rtLayer.error);
            }
            const token = rtLayer.result;
            // web3 트랜잭션 발생
            const web3Layer = yield this.web3Service
                .sendTransaction(memberWallet.address.privateKey, memberWallet.address.address, enterpiseWallet.address.address, memberWallet.balance.amount, memberWallet.balance.unit);
            if (web3Layer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                // 실패 시 기록
                const recordLayer = yield this.repositoryService
                    .recordWithrawCancel(token, {
                    type: wallet_api_eth_common_1.eHistory.withraw,
                    walletId: memberWallet.id,
                    coin: coin,
                    unit: wallet_api_eth_common_1.EtherDefaultUnit,
                    total: total,
                    amount: amount,
                    fee: fee,
                    commission: '0',
                    toFrom: enterpiseWallet.address.address,
                    state: wallet_api_eth_common_1.eState.fail
                });
                if (recordLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                    return new wallet_api_eth_common_1.Response(recordLayer.error);
                }
                return new wallet_api_eth_common_1.Response(web3Layer.error);
            }
            const txid = web3Layer.result;
            // 성공 시 기록
            const recordLayer = yield this.repositoryService
                .recordWithrawRequest(token, {
                txid: txid,
                type: wallet_api_eth_common_1.eHistory.withraw,
                walletId: memberWallet.id,
                coin: coin,
                unit: wallet_api_eth_common_1.EtherDefaultUnit,
                total: total,
                amount: amount,
                fee: fee,
                commission: '0',
                toFrom: enterpiseWallet.address.address,
                state: wallet_api_eth_common_1.eState.request
            });
            if (recordLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(recordLayer.error);
            }
            return new wallet_api_eth_common_1.Response().to({ state: wallet_api_eth_common_1.eState.request, unit: wallet_api_eth_common_1.EtherDefaultUnit, total: total, amount: amount, fee: fee, commission: '0' });
        });
    }
    /**
     * 출금 준비 단계
     * @param dto 출금준비 dto
     */
    prepareWithdraw(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // check has
            const hasMemberWallet = yield this.repositoryService
                .hasWalletByUUID(dto.uuid, coin);
            if (hasMemberWallet.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasMemberWallet.error);
            }
            // check has
            const hasEnterpirseWallet = yield this.repositoryService
                .hasEnterpirseWallet(coin);
            if (hasEnterpirseWallet.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasEnterpirseWallet.error);
            }
            // amount 있는지 비교
            const rt = hasEnterpirseWallet.result;
            if (true === wallet_api_eth_common_1.EthUtill.isLessThan(rt.balance.amount, rt.balance.unit, dto.amount, dto.unit)) {
                return new wallet_api_eth_common_1.Response(wallet_api_eth_common_1.eErrorCode.NotEnoughBalance);
            }
            // 토큰 발급
            const rtLayer = yield this.repositoryService
                .setPreparedWithraw(coin, rt.id, dto.uuid, dto.amount, dto.unit, dto.to.toLowerCase());
            if (rtLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(rtLayer.error);
            }
            return new wallet_api_eth_common_1.Response().to({ token: rtLayer.result });
        });
    }
    /**
     * 출금 요청
     * @param dto 출금 dto
     */
    requestWithdraw(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            // 문제점
            // 이런 구조이면 100% 중복 처리 된다. 동시성 때문에
            // check has
            const hasMemberWallet = yield this.repositoryService
                .hasWalletByUUID(dto.uuid, coin);
            if (hasMemberWallet.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasMemberWallet.error);
            }
            // check has
            const hasEnterpirseWallet = yield this.repositoryService
                .hasEnterpirseWallet(coin);
            if (hasEnterpirseWallet.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(hasEnterpirseWallet.error);
            }
            const rt = hasEnterpirseWallet.result;
            // 토큰 유효성 체크
            const prepareLayer = yield this.repositoryService
                .getPreparedWithraw(dto.token);
            if (prepareLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(prepareLayer.error);
            }
            const withraw = prepareLayer.result;
            // amount 있는지 비교
            if (true === wallet_api_eth_common_1.EthUtill.isLessThan(rt.balance.amount, rt.balance.unit, withraw.amount, withraw.unit)) {
                return new wallet_api_eth_common_1.Response(wallet_api_eth_common_1.eErrorCode.NotEnoughBalance);
            }
            const unit = wallet_api_eth_common_1.EtherDefaultUnit;
            // total = amount + fee
            const total = wallet_api_eth_common_1.EthUtill.toWei(withraw.amount, withraw.unit).toString();
            // amount
            const amount = wallet_api_eth_common_1.EthUtill.sub(withraw.amount, withraw.unit, this.web3Service.getFeeWei(), unit).toString();
            // fee
            const fee = this.web3Service.getFeeWei();
            // web3 트랜잭션 발생
            const web3Layer = yield this.web3Service
                .sendTransaction(rt.address.privateKey, rt.address.address, withraw.to, withraw.amount, withraw.unit);
            if (web3Layer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                // 실패 시 기록
                const recordLayer = yield this.repositoryService
                    .recordWithrawCancel(dto.token, {
                    type: wallet_api_eth_common_1.eHistory.withraw,
                    walletId: rt.id,
                    coin: coin,
                    unit: wallet_api_eth_common_1.EtherDefaultUnit,
                    total: total,
                    amount: amount,
                    fee: fee,
                    commission: '0',
                    toFrom: withraw.to,
                    state: wallet_api_eth_common_1.eState.fail
                });
                if (recordLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                    return new wallet_api_eth_common_1.Response(recordLayer.error);
                }
                return new wallet_api_eth_common_1.Response(web3Layer.error);
            }
            const txid = web3Layer.result;
            // 성공 시 기록
            const recordLayer = yield this.repositoryService
                .recordWithrawRequest(dto.token, {
                txid: txid,
                type: wallet_api_eth_common_1.eHistory.withraw,
                walletId: rt.id,
                coin: coin,
                unit: unit,
                total: total,
                amount: amount,
                fee: fee,
                commission: '0',
                toFrom: withraw.to,
                state: wallet_api_eth_common_1.eState.request
            });
            if (recordLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(recordLayer.error);
            }
            return new wallet_api_eth_common_1.Response().to({ state: wallet_api_eth_common_1.eState.request, unit: wallet_api_eth_common_1.EtherDefaultUnit, total: total, amount: amount, fee: fee, commission: '0' });
        });
    }
    /**
     * 거래 기록 조회
     * @param uuid 고유번호
     * @param type 거래타입
     * @param offset 개수
     * @param page 페이지
     */
    getHistory(uuid, type, offset, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            const rtLayer = yield this.repositoryService
                .getHistory(uuid, coin, type, offset, page);
            if (rtLayer.error !== wallet_api_eth_common_1.eErrorCode.Success) {
                return new wallet_api_eth_common_1.Response(rtLayer.error);
            }
            // payload
            return new wallet_api_eth_common_1.Response().to(rtLayer.result);
        });
    }
};
WalletService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [RepositoryService_1.RepositoryService, Web3Service_1.Web3Service])
], WalletService);
exports.WalletService = WalletService;
//# sourceMappingURL=WalletService.js.map