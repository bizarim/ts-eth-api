import { Service } from 'typedi';
import { eWithdraw, eRole, RtCreatedAddress, LayerResult, eErrorCode, RtBalance, RtWallet, RecordBook, eHistory, eState, EtherDefaultUnit, UndefiendEntityException, CalcLessThanException, EthUtill, makeUUID } from 'wallet-api-eth-common';
import { Wallet, Address, Balance, History, Withdraw } from 'wallet-eth-repository';
import { getRepository, getManager, getConnection } from 'typeorm';
import { Logger } from '../middleware/Logger';

@Service()
export class RepositoryService {
    private logger: Logger;
    constructor() {
        this.logger = new Logger();
    }

    /**
     * 기업 주소 지갑 정보 얻기
     * @param coin 암호화폐
     */
    public async hasEnterpirseWallet(coin: string): Promise<LayerResult> {
        try {
            const walletRepository = getRepository(Wallet);

            const enterpise = await walletRepository
                .findOne({ role: eRole.enterprise }, { relations: ['address', 'balance'] });
            if (undefined === enterpise) {
                return { error: eErrorCode.NoneExistCoinAddress } as LayerResult;
            }

            const etherAddress = enterpise
                .address
                .find(o => o.coin === coin);
            if (undefined === etherAddress) {
                return { error: eErrorCode.NoneExistCoinAddress } as LayerResult;
            }

            const etherBalance = enterpise
                .balance
                .find(o => o.coin === coin);
            if (undefined === etherBalance) {
                return { error: eErrorCode.NoneExistCoinAddress } as LayerResult;
            }

            return {
                error: eErrorCode.Success,
                result: {
                    id: enterpise.id, uuid: enterpise.uuid,
                    address: { coin: etherAddress.coin, privateKey: etherAddress.privateKey, address: etherAddress.address } as RtCreatedAddress,
                    balance: { coin: etherBalance.coin, amount: etherBalance.amount, unit: etherBalance.unit } as RtBalance
                } as RtWallet
            } as LayerResult;

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }

    /**
     * uuid로 지갑 정보 얻기
     * @param uuid 고유번호
     * @param coin 암호화폐
     */
    public async hasWalletByUUID(uuid: string, coin: string): Promise<LayerResult> {
        try {
            const walletRepository = getRepository(Wallet);

            const member = await walletRepository
                .findOne({ uuid: uuid }, { relations: ['address', 'balance'] });
            if (undefined === member) {
                return { error: eErrorCode.NoneExistCoinAddress } as LayerResult;
            }

            const etherAddress = member
                .address
                .find(o => o.coin === coin);
            if (undefined === etherAddress) {
                return { error: eErrorCode.NoneExistCoinAddress } as LayerResult;
            }

            const etherBalance = member
                .balance
                .find(o => o.coin === coin);
            if (undefined === etherBalance) {
                return { error: eErrorCode.NoneExistCoinAddress } as LayerResult;
            }

            return {
                error: eErrorCode.Success,
                result: {
                    id: member.id, uuid: member.uuid,
                    address: { coin: etherAddress.coin, privateKey: etherAddress.privateKey, address: etherAddress.address } as RtCreatedAddress,
                    balance: { coin: etherBalance.coin, amount: etherBalance.amount, unit: etherBalance.unit } as RtBalance
                } as RtWallet
            } as LayerResult;

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }

    /**
     * 주소 등록
     * @param coin 암호화폐
     * @param role 롤
     * @param address 주소
     * @param privateKey 프라이빗 키
     * @param uuid 고유번호
     */
    public async register(coin: string, role: eRole, address: string, privateKey: string, uuid: string): Promise<LayerResult> {

        try {
            const walletRepository = getRepository(Wallet);
            let wallet = await walletRepository
                .findOne({ uuid: uuid }, { relations: ['address', 'balance'] });
            if (undefined !== wallet) {
                return { error: eErrorCode.AlreadyHasEthAddress } as LayerResult;
            }

            wallet = new Wallet();
            wallet.uuid = uuid;
            wallet.role = role;
            wallet.address = [];
            wallet.balance = [];

            wallet.address.push({ coin: coin, privateKey: privateKey, address: address } as Address);
            wallet.balance.push({ amount: '0', coin: coin } as Balance);
            await walletRepository.save(wallet);

            return { error: eErrorCode.Success } as LayerResult;

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }

    /**
     * 출금 취소
     * @param token 토큰
     * @param book 기록지
     */
    public async recordWithrawCancel(token: string, book: RecordBook): Promise<LayerResult> {
        try {
            await getManager().transaction(async trManager => {

                const withdraw = await trManager
                    .createQueryBuilder(Withdraw, 'withdraw')
                    .setLock('pessimistic_write')
                    .where('withdraw.token = :token', { token: token })
                    .getOne();
                if (undefined === withdraw) throw new UndefiendEntityException();

                const history = new History();
                history.walletId = book.walletId;
                history.coin = book.coin;
                history.type = book.type;
                history.toFrom = book.toFrom;
                history.unit = book.unit;
                history.amount = book.amount;
                history.fee = book.fee;
                history.commission = book.commission;
                history.state = book.state;
                const dbHistory = await trManager.save(history);
                book.historyId = dbHistory.id;
                await trManager.save(withdraw);
            });
            return { error: eErrorCode.Success, result: book } as LayerResult;

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }

    /**
     * 출금 요청 pending 상태
     * @param token 토큰
     * @param book 기록지
     */
    public async recordWithrawRequest(token: string, book: RecordBook): Promise<LayerResult> {

        try {
            await getManager().transaction(async trManager => {
                const withdraw = await trManager
                    .createQueryBuilder(Withdraw, 'withdraw')
                    .setLock('pessimistic_write')
                    .where('withdraw.token = :token', { token: token })
                    .getOne();
                if (undefined === withdraw) throw new UndefiendEntityException();

                const balance = await trManager
                    .createQueryBuilder(Balance, 'balance')
                    .setLock('pessimistic_write')
                    .where('balance.walletId = :id', { id: book.walletId })
                    .andWhere('balance.coin = :coin', { coin: book.coin })
                    .getOne();
                if (undefined === balance) throw new UndefiendEntityException();
                if (true === EthUtill.isLessThan(
                    balance.amount,
                    EtherDefaultUnit,
                    book.total,
                    book.unit)) throw new CalcLessThanException();

                // update balance
                balance.amount = EthUtill.sub(
                    balance.amount,
                    balance.unit,
                    book.total,
                    book.unit).toString();

                // insert history
                const history = new History();
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
                withdraw.state = eWithdraw.completed;

                await trManager.save(balance);
                await trManager.save(history);
                await trManager.save(withdraw);
            });
            return { error: eErrorCode.Success } as LayerResult;

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }

    /**
     * 거래 히스토리 요청
     * @param uuid 고유번호
     * @param coin 암호화폐
     * @param type 입출금 타입
     * @param offset 개수
     * @param page 페이지
     */
    public async getHistory(uuid: string, coin: string, type?: string, offset?: number, page?: number): Promise<LayerResult> {
        try {
            const sum = await getConnection()
                .createQueryBuilder()
                .select('hitstory.id', 'id')
                .from(History, 'history')
                .leftJoin(Wallet, 'wallet', 'history.walletId = wallet.id')
                .where('wallet.uuid=:uuid', { uuid: uuid })
                .where('history.coin=:coin', { coin: coin })
                .getCount();

            const curType1 = type === undefined ? eHistory.deposit : type;
            const curType2 = type === undefined ? eHistory.withraw : type;
            const curOffset = offset === undefined ? 10 : offset;
            let curPage = page === undefined ? 1 : page;
            const totPage = Math.floor(sum / curOffset) + 1;
            curPage = curPage < 0 ? 1 : curPage;
            curPage = totPage < curPage ? totPage : curPage;


            const rt = await getConnection()
                .createQueryBuilder()
                .select('history')
                .from(History, 'history')
                .leftJoin(Wallet, 'wallet', 'history.walletId = wallet.id')
                .where('wallet.uuid=:uuid AND history.coin=:coin AND (history.type=:type1 OR history.type=:type2)', { uuid: uuid, coin: coin, type1: curType1, type2: curType2 })
                .orderBy('history.id', 'DESC')
                .skip((curPage - 1) * curOffset)
                .take(curOffset)
                .getMany();

            return { error: eErrorCode.Success, result: { list: rt, totPage: totPage, curPage: curPage, totCnt: sum } } as LayerResult;

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }

    /**
     * 출금 준비단계 얻어오기
     * @param coin 암호화폐
     * @param uuid 요청자 고유번호
     * @param token 토큰
     */
    public async getPreparedWithraw(token: string): Promise<LayerResult> {
        let error: eErrorCode = eErrorCode.DbError;
        try {
            let dbWithdraw: Withdraw | undefined = undefined;
            await getManager().transaction(async trManager => {
                const withdraw = await trManager
                    .createQueryBuilder(Withdraw, 'withdraw')
                    .setLock('pessimistic_write')
                    .where('withdraw.token = :token', { token: token })
                    .getOne();

                if (undefined === withdraw) {
                    error = eErrorCode.NoneExistWithdrawToken;
                    throw new Error('NoneExistWithdrawToken');
                }
                if (withdraw.state !== eWithdraw.request) {
                    error = eErrorCode.InvalidWithdrawToken;
                    throw new Error('InvalidWithdrawToken');
                }

                withdraw.state = eWithdraw.prepared;
                dbWithdraw = await trManager.save(withdraw);
            });

            if (undefined === dbWithdraw) {
                return { error: eErrorCode.DbError } as LayerResult;
            }

            dbWithdraw = dbWithdraw as Withdraw;
            return {
                error: eErrorCode.Success,
                result: {
                    uuid: dbWithdraw.requester,
                    amount: dbWithdraw.amount,
                    unit: dbWithdraw.unit,
                    to: dbWithdraw.to
                }
            } as LayerResult;
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: error } as LayerResult;
        }
    }

    public async setPreparedWithraw(coin: string, walletId: number, uuid: string, amount: string, unit: string, to: string): Promise<LayerResult> {
        try {
            const withdrawRepository = getRepository(Withdraw);
            const withdraw = new Withdraw();
            withdraw.coin = coin;
            withdraw.walletId = walletId;
            withdraw.requester = uuid;
            withdraw.to = to;
            withdraw.amount = amount;
            withdraw.unit = unit;
            withdraw.token = makeUUID();
            withdraw.state = eWithdraw.request;
            await withdrawRepository.save(withdraw);

            return { error: eErrorCode.Success, result: withdraw.token } as LayerResult;
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(JSON.stringify(e.message));
                this.logger.error(JSON.stringify(e.stack));
            } else {
                this.logger.error(JSON.stringify(e));
            }
            return { error: eErrorCode.DbError } as LayerResult;
        }
    }
}
