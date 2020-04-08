import { Transaction } from 'web3-eth';
import { getRepository, getManager, In } from 'typeorm';
import { Wallet, Address, Balance, History } from 'wallet-eth-repository';
import { eState, eCoin, eHistory, UndefiendEntityException, eErrorCode, EthUtill, CalcLessThanException, EtherDefaultUnit } from 'wallet-api-eth-common';
import { Logger } from '../Logger';

export class ProcRecord {
    private logger: Logger;
    private trans: Transaction[] | null;
    constructor(trans: Transaction[] | null) {
        this.trans = trans;
        this.logger = new Logger();
    }

    public async execute() {
        try {
            this.run();
        } catch (e) {
            console.log(e);
        }
    }

    private async run() {
        if (undefined === this.trans) return;
        if (null === this.trans) return;
        if (this.trans.length < 1) return;

        // console.log(this.trans);
        const state: State[] = [];
        const address: string[] = [];
        for (let i = 0; i < this.trans.length; ++i) {
            if (null !== this.trans[i].to && null !== this.trans[i].from) {
                let mainAddr = this.trans[i].to as string;
                mainAddr = mainAddr.toLowerCase();
                const subAddr = this.trans[i].from.toLowerCase();
                state.push({ txid: this.trans[i].hash.toLowerCase(), direc: 'to', mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                address.push(mainAddr);
            }

            if (null !== this.trans[i].to && null !== this.trans[i].from) {
                const mainAddr = this.trans[i].from.toLowerCase();
                let subAddr = this.trans[i].to as string;
                subAddr = subAddr.toLowerCase();
                state.push({ txid: this.trans[i].hash.toLowerCase(), direc: 'from', mainAddr: mainAddr, subAddr: subAddr, amount: this.trans[i].value, unit: 'wei', walletId: 0 });
                address.push(mainAddr);
            }
        }
        // console.log(address);
        const addressRepository = getRepository(Address);
        const historyRepository = getRepository(History);
        // console.log(state);
        const list = await addressRepository.find({ address: In(address) });
        const strList = JSON.stringify(list);
        console.log(strList);
        this.logger.info(strList);
        const managedList: State[] = [];
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
            if (0 === managedList[i].walletId) continue;
            const dbHistory = await historyRepository.findOne({ walletId: managedList[i].walletId, transactionId: managedList[i].txid });
            if (undefined === dbHistory) {

                await getManager().transaction(async trManager => {

                    const balance = await trManager
                        .createQueryBuilder(Balance, 'balance')
                        .setLock('pessimistic_write')
                        .where('balance.walletId = :id', { id: managedList[i].walletId })
                        .andWhere('balance.coin = :coin', { coin: eCoin.eth })
                        .getOne();

                    // todo custom exception
                    if (undefined === balance) throw new UndefiendEntityException();
                    balance.amount = EthUtill.add(balance.amount, balance.unit, managedList[i].amount, managedList[i].unit).toString();

                    const history = new History();
                    history.walletId = managedList[i].walletId;
                    history.coin = eCoin.eth;
                    history.type = eHistory.deposit;
                    history.toFrom = managedList[i].subAddr;
                    history.unit = managedList[i].unit;
                    history.amount = managedList[i].amount;
                    history.fee = '0';
                    history.commission = '0';
                    history.state = eState.confirm;
                    history.transactionId = managedList[i].txid;

                    await trManager.save(balance);
                    await trManager.save(history);
                });
            } else {
                dbHistory.state = eState.confirm;
                historyRepository.save(dbHistory);
            }
        }
    }
}



export class State {
    txid: string;
    direc: string;
    mainAddr: string;
    subAddr: string;
    amount: string;
    unit: string;
    walletId: number;
}