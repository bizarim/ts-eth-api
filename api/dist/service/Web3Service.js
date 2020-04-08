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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Web3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const web3_1 = __importDefault(require("web3"));
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const Logger_1 = require("../middleware/Logger");
const ethereumjs_tx_1 = require("ethereumjs-tx");
const rpc_1 = require("../rpc");
let Web3Service = Web3Service_1 = class Web3Service {
    constructor() {
        this.logger = new Logger_1.Logger();
        if (false === Web3Service_1.init) {
            const loader = new wallet_api_eth_common_1.ConfigLoader(wallet_api_eth_common_1.MainPath.get(), 'config');
            this.ep = loader.get(wallet_api_eth_common_1.eConfig.web3).infura.ep;
            Web3Service_1.infura = new web3_1.default(loader.get(wallet_api_eth_common_1.eConfig.web3).infura.ep);
            Web3Service_1.fastnode = new web3_1.default(loader.get(wallet_api_eth_common_1.eConfig.web3).fastnode.ep);
            Web3Service_1.init = true;
            // console.log('Web3Service constructor init: ' + Web3Service.init + ' infura: ' + loader.get<Web3Coinfig>(eConfig.web3).infura.ep);
            // console.log('Web3Service constructor init: ' + Web3Service.init + ' fastnode: ' + loader.get<Web3Coinfig>(eConfig.web3).fastnode.ep);
        }
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return 'test';
        });
    }
    /**
     * 주소 생성
     */
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            const account = Web3Service_1.fastnode.eth.accounts.create();
            this.logger.info('accounts.create: ' + JSON.stringify(account));
            return {
                error: wallet_api_eth_common_1.eErrorCode.Success,
                result: { coin: coin, privateKey: account.privateKey, address: account.address.toLowerCase() }
            };
        });
    }
    /**
     * 잔액 조회
     * @param addr 주소
     */
    getBalance(addr) {
        return __awaiter(this, void 0, void 0, function* () {
            const coin = wallet_api_eth_common_1.Cryptocurrency.get();
            let cbError = undefined;
            const rt = yield Web3Service_1.infura.eth.getBalance(addr, (err, balance) => {
                cbError = err;
                this.logger.info('sendSignedTransaction hash: ' + balance);
            });
            return rt;
        });
    }
    /**
     * 거래 발생
     * @param privateKey 프라이빗 키
     * @param from 어디서
     * @param to 어디로
     * @param amount 얼마만큼
     * @param unit 단위
     */
    sendTransaction(privateKey, from, to, amount, unit) {
        return __awaiter(this, void 0, void 0, function* () {
            const cbError = undefined;
            // (EthUtill.toWei(amount, unit).add
            // 계산
            const calcAmount = wallet_api_eth_common_1.EthUtill.sub(amount, unit, this.getFeeWei(), wallet_api_eth_common_1.EtherDefaultUnit);
            // from address의 발생 트랜잭션 얻어오기
            // 이유: 있다.
            const cnt = yield Web3Service_1.infura.eth.getTransactionCount(from);
            // 전문
            const payload = {
                nonce: Web3Service_1.infura.utils.toHex(cnt),
                to: to,
                value: Web3Service_1.infura.utils.toHex(calcAmount),
                gasLimit: Web3Service_1.infura.utils.toHex(Web3Service_1.gasLimit),
                gasPrice: Web3Service_1.infura.utils.toHex(Web3Service_1.gasPrice)
            };
            const pk = Buffer.from(privateKey.substring(2), 'hex');
            const tx = new ethereumjs_tx_1.Transaction(payload);
            try {
                tx.sign(pk);
            }
            catch (e) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
                return { error: wallet_api_eth_common_1.eErrorCode.Web3Error };
            }
            const raw = tx.serialize();
            const rpc = new rpc_1.EthRpcClinet({ endpoint: this.ep });
            const rpcRes = yield rpc.call('eth_sendRawTransaction', [('0x' + raw.toString('hex'))]);
            if (undefined !== rpcRes.error || rpcRes.context === undefined) {
                this.logger.error(JSON.stringify(rpcRes.error));
                return { error: wallet_api_eth_common_1.eErrorCode.Web3Error };
            }
            const txid = rpcRes.context.result;
            this.logger.info('txid: ' + txid);
            return { error: wallet_api_eth_common_1.eErrorCode.Success, result: txid.toLowerCase() };
        });
    }
    /**
     * 가스비 얻기 (wei)
     *  - gasLimit = 21000
     *  - gasPrice = 8000000000
     */
    getFeeWei() {
        return (Web3Service_1.gasLimit * Web3Service_1.gasPrice).toString();
    }
};
Web3Service.gasLimit = 21000; // 3144658
Web3Service.gasPrice = 8000000000; // 12 wei
Web3Service.init = false;
Web3Service = Web3Service_1 = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], Web3Service);
exports.Web3Service = Web3Service;
//# sourceMappingURL=Web3Service.js.map