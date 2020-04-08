import { Transaction } from 'web3-eth';
import { getRepository, getManager, In } from 'typeorm';
import { Address, Balance, History } from 'wallet-eth-repository';
import { eState, eCoin, eHistory, UndefiendEntityException, EthUtill } from 'wallet-api-eth-common';
import { Logger } from '../middleware/Logger';

export class ProcRecord {
    private logger: Logger;
    private trans: Transaction[] | null;
    private height: number;
    constructor(height: number, trans: Transaction[] | null) {
        this.height = height;
        this.trans = trans;
        this.logger = new Logger();
    }

    public async execute() {
        try {
            this.run();
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
        }
    }

    private async run() {
        if (undefined === this.trans) return;
        if (null === this.trans) return;
        if (this.trans.length < 1) return;

        // 트랜잭션 해석 하기
        const snalysis: Analysis[] = [];
        const address: string[] = [];
        for (let i = 0; i < this.trans.length; ++i) {
            // deposit
            if (null !== this.trans[i].to && null !== this.trans[i].from) {
                let mainAddr = this.trans[i].to as string;
                mainAddr = mainAddr.toLowerCase();
                const subAddr = this.trans[i].from.toLowerCase();
                snalysis.push({ txid: this.trans[i].hash.toLowerCase(), direc: eHistory.deposit, mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                address.push(mainAddr);
            }
            // withdraw
            if (null !== this.trans[i].to && null !== this.trans[i].from) {
                const mainAddr = this.trans[i].from.toLowerCase();
                let subAddr = this.trans[i].to as string;
                subAddr = subAddr.toLowerCase();
                snalysis.push({ txid: this.trans[i].hash.toLowerCase(), direc: eHistory.withraw, mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                address.push(mainAddr);
            }
        }

        // 트랜잭션에서 관리되는 주소 걸러 내기
        const addressRepository = getRepository(Address);
        const hasAddressList = await addressRepository.find({ address: In(address) });

        const depositList: Analysis[] = [];
        const withdrawList: Analysis[] = [];
        for (let i = 0; i < hasAddressList.length; ++i) {
            for (let j = 0; j < snalysis.length; ++j) {

                if (snalysis[j].mainAddr.toLowerCase() == hasAddressList[i].address.toLowerCase()) {
                    snalysis[j].walletId = hasAddressList[i].walletId;
                    // 입출금 구분하기
                    if (snalysis[j].direc === eHistory.deposit)
                        depositList.push(snalysis[j]);
                    else
                        withdrawList.push(snalysis[j]);
                }
            }
        }

        // 입금 확인 처리
        this.logger.info(`height: ${this.height}, deposit: ` + JSON.stringify(depositList));
        for (let i = 0; i < depositList.length; ++i) {

            await getManager().transaction(async trManager => {

                const balance = await trManager
                    .createQueryBuilder(Balance, 'balance')
                    .setLock('pessimistic_write')
                    .where('balance.walletId = :id', { id: depositList[i].walletId })
                    .andWhere('balance.coin = :coin', { coin: eCoin.eth })
                    .getOne();

                if (undefined === balance) throw new UndefiendEntityException();
                balance.amount = EthUtill.add(balance.amount, balance.unit, depositList[i].amount, depositList[i].unit).toString();

                const history = new History();
                history.walletId = depositList[i].walletId;
                history.coin = eCoin.eth;
                history.type = eHistory.deposit;
                history.toFrom = depositList[i].subAddr;
                history.unit = depositList[i].unit;
                history.amount = depositList[i].amount;
                history.fee = '0';
                history.commission = '0';
                history.state = eState.confirm;
                history.transactionId = depositList[i].txid;

                await trManager.save(balance);
                await trManager.save(history);
            });
        }

        // 출금 확인 처리
        this.logger.info(`height: ${this.height}, withdraw: ` + JSON.stringify(withdrawList));
        const historyRepository = getRepository(History);

        for (let i = 0; i < withdrawList.length; ++i) {

            const history = new History();
            history.walletId = withdrawList[i].walletId;
            history.coin = eCoin.eth;
            history.type = eHistory.withraw;
            history.toFrom = withdrawList[i].subAddr;
            history.unit = withdrawList[i].unit;
            history.amount = withdrawList[i].amount;
            history.fee = '0';
            history.commission = '0';
            history.state = eState.confirm;
            history.transactionId = withdrawList[i].txid;

            await historyRepository.save(history);
        }
    }
}



export class Analysis {
    txid: string;
    direc: eHistory;
    mainAddr: string;
    subAddr: string;
    amount: string;
    unit: string;
    walletId: number;
}