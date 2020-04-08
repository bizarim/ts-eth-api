import { Service } from 'typedi';
import Web3 from 'web3';
import { TransactionReceipt } from 'web3-core';
import { ConfigLoader, eConfig, MainPath, Web3Coinfig, LayerResult, eErrorCode, RtCreatedAddress, makePassPhrase, Cryptocurrency, EtherDefaultUnit, EthUtill } from 'wallet-api-eth-common';
import { Logger } from '../middleware/Logger';
import { Transaction } from 'ethereumjs-tx';
import { EthRpcClinet } from '../rpc';

@Service()
export class Web3Service {
    private logger: Logger;
    public static readonly gasLimit: number = 21000; // 3144658
    public static readonly gasPrice: number = 8000000000; // 12 wei
    private static init: boolean = false;
    private static infura: Web3;
    private static fastnode: Web3;
    private ep: string;
    constructor() {
        this.logger = new Logger();
        if (false === Web3Service.init) {
            const loader = new ConfigLoader(MainPath.get(), 'config');
            this.ep = loader.get<Web3Coinfig>(eConfig.web3).infura.ep;
            Web3Service.infura = new Web3(loader.get<Web3Coinfig>(eConfig.web3).infura.ep);
            Web3Service.fastnode = new Web3(loader.get<Web3Coinfig>(eConfig.web3).fastnode.ep);
            Web3Service.init = true;
            // console.log('Web3Service constructor init: ' + Web3Service.init + ' infura: ' + loader.get<Web3Coinfig>(eConfig.web3).infura.ep);
            // console.log('Web3Service constructor init: ' + Web3Service.init + ' fastnode: ' + loader.get<Web3Coinfig>(eConfig.web3).fastnode.ep);
        }
    }

    public async test(): Promise<string> {
        return 'test';
    }

    /**
     * 주소 생성
     */
    public async create(): Promise<LayerResult> {
        const coin = Cryptocurrency.get();

        const account = Web3Service.fastnode.eth.accounts.create();

        this.logger.info('accounts.create: ' + JSON.stringify(account));

        return {
            error: eErrorCode.Success,
            result: { coin: coin, privateKey: account.privateKey, address: account.address.toLowerCase() } as RtCreatedAddress
        } as LayerResult;
    }

    /**
     * 잔액 조회
     * @param addr 주소
     */
    public async getBalance(addr: string): Promise<string> {
        const coin = Cryptocurrency.get();
        let cbError: Error | null | undefined = undefined;

        const rt = await Web3Service.infura.eth.getBalance(addr, (err, balance) => {
            cbError = err;
            this.logger.info('sendSignedTransaction hash: ' + balance);
        });

        return rt;
    }

    /**
     * 거래 발생
     * @param privateKey 프라이빗 키
     * @param from 어디서
     * @param to 어디로
     * @param amount 얼마만큼
     * @param unit 단위
     */
    public async sendTransaction(privateKey: string, from: string, to: string, amount: string, unit: string): Promise<LayerResult> {
        const cbError: Error | null | undefined = undefined;
        // (EthUtill.toWei(amount, unit).add

        // 계산
        const calcAmount = EthUtill.sub(
            amount,
            unit,
            this.getFeeWei(),
            EtherDefaultUnit
        );

        // from address의 발생 트랜잭션 얻어오기
        // 이유: 있다.
        const cnt = await Web3Service.infura.eth.getTransactionCount(from);

        // 전문
        const payload = {
            nonce: Web3Service.infura.utils.toHex(cnt),
            to: to,
            value: Web3Service.infura.utils.toHex(calcAmount),
            gasLimit: Web3Service.infura.utils.toHex(Web3Service.gasLimit),
            gasPrice: Web3Service.infura.utils.toHex(Web3Service.gasPrice)
        };

        const pk = Buffer.from(privateKey.substring(2), 'hex');
        const tx = new Transaction(payload);

        try {
            tx.sign(pk);
        } catch (e) {
            this.logger.error(JSON.stringify(e.message));
            this.logger.error(JSON.stringify(e.stack));
            return { error: eErrorCode.Web3Error } as LayerResult;
        }
        const raw = tx.serialize();

        const rpc = new EthRpcClinet({ endpoint: this.ep });
        const rpcRes = await rpc.call('eth_sendRawTransaction', [('0x' + raw.toString('hex'))]);
        if (undefined !== rpcRes.error || rpcRes.context === undefined) {
            this.logger.error(JSON.stringify(rpcRes.error));
            return { error: eErrorCode.Web3Error } as LayerResult;
        }
        const txid = rpcRes.context.result as string;
        this.logger.info('txid: ' + txid);
        return { error: eErrorCode.Success, result: txid.toLowerCase() } as LayerResult;

    }

    /**
     * 가스비 얻기 (wei)
     *  - gasLimit = 21000
     *  - gasPrice = 8000000000
     */
    public getFeeWei(): string {
        return (Web3Service.gasLimit * Web3Service.gasPrice).toString();
    }
}
