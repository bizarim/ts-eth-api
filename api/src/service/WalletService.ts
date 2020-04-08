import { Service } from 'typedi';
import { RepositoryService } from './RepositoryService';
import { Web3Service } from './Web3Service';
import { eErrorCode, RtWithdraw, RtCreatedAddress, Response, IPayload, eRole, Cryptocurrency, RtWallet, RecordBook, eState, eHistory, EtherDefaultUnit, EthUtill } from 'wallet-api-eth-common';
import { WithdrawDto, PrepareWithdrawDto } from '../dto';
import { Logger } from '../middleware/Logger';


@Service()
export class WalletService {
    private logger: Logger;
    constructor(private repositoryService: RepositoryService, private web3Service: Web3Service) {
        this.logger = new Logger();
    }

    public async test(): Promise<string> {
        return 'test';
    }

    /**
     * 기업 회원 등록
     * @param uuid 고유번호
     */
    public async registerEnterprise(uuid: string): Promise<Response> {

        const coin = Cryptocurrency.get();
        // check has
        const hasLayer = await this.repositoryService
            .hasEnterpirseWallet(coin);
        if (hasLayer.error === eErrorCode.Success &&
            hasLayer.result !== undefined) {
            return new Response(eErrorCode.AlreadyHasEthAddress);
        } else if (hasLayer.error !== eErrorCode.NoneExistCoinAddress) {
            return new Response(hasLayer.error);
        }

        // create address
        const account = await this.web3Service.create();
        const rt = account.result as RtCreatedAddress;

        // call repository
        const layerRepo = await this.repositoryService
            .register(
                coin,
                eRole.enterprise,
                rt.address,
                rt.privateKey,
                uuid);
        if (layerRepo.error !== eErrorCode.Success) {
            return new Response(layerRepo.error);
        }

        return new Response().to({ coin: coin, address: rt.address, uuid: uuid } as IPayload);
    }

    /**
     * 일반 멤버 등록
     * @param uuid 고유번호
     */
    public async registerMember(uuid: string): Promise<Response> {

        const coin = Cryptocurrency.get();

        // check has
        const hasLayer = await this.repositoryService
            .hasWalletByUUID(
                uuid,
                coin);
        if (hasLayer.error === eErrorCode.Success &&
            hasLayer.result !== undefined) {
            return new Response(eErrorCode.AlreadyHasEthAddress);
        } else if (hasLayer.error !== eErrorCode.NoneExistCoinAddress) {
            return new Response(hasLayer.error);
        }

        // create address
        const account = await this.web3Service.create();
        const rt = account.result as RtCreatedAddress;

        // call repository
        const layerRepo = await this.repositoryService
            .register(
                coin,
                eRole.member,
                rt.address,
                rt.privateKey,
                uuid);
        if (layerRepo.error !== eErrorCode.Success) {
            return new Response(layerRepo.error);
        }

        return new Response().to({ coin: coin, address: rt.address, uuid: uuid } as IPayload);
    }

    /**
     * 잔액 조회
     *  - 입금 확인용
     * @param uuid 고유번호
     */
    async getBalance(uuid: string): Promise<Response> {
        const coin = Cryptocurrency.get();

        // 만약 원장에는 처리 되지만
        // 스케쥴 서버에서 오류가 생겨 db에 반영이 안된경우
        // cs 처리 해야 한다.

        // check has
        const hasLayer = await this.repositoryService
            .hasWalletByUUID(
                uuid,
                coin);
        if (hasLayer.error !== eErrorCode.Success) {
            return new Response(hasLayer.error);
        }
        const rt = hasLayer.result as RtWallet;

        // payload
        return new Response().to({ coin: rt.balance.coin, amount: rt.balance.amount, unit: rt.balance.unit } as IPayload);
    }

    /**
     * 주요정보 제공
     * @param uuid 고유번호
     */
    async getPrimary(uuid: string): Promise<Response> {
        const coin = Cryptocurrency.get();

        // check has
        const hasLayer = await this.repositoryService
            .hasWalletByUUID(
                uuid,
                coin);
        if (hasLayer.error !== eErrorCode.Success) {
            return new Response(hasLayer.error);
        }
        const rt = hasLayer.result as RtWallet;

        // payload
        return new Response().to({ coin: rt.balance.coin, amount: rt.balance.amount, unit: rt.balance.unit, address: rt.address.address } as IPayload);
    }

    /**
     * 입금된 암호화폐 회사 주소로 전송
     * @param uuid 고유번호
     */
    public async requestTransfer(uuid: string): Promise<Response> {
        const coin = Cryptocurrency.get();

        // 문제점
        // 이런 구조이면 100% 중복 처리 된다. 동시성 때문에

        // check has
        const hasEnterpirseLayer = await this.repositoryService
            .hasEnterpirseWallet(coin);
        if (hasEnterpirseLayer.error !== eErrorCode.Success) {
            return new Response(hasEnterpirseLayer.error);
        }

        // check has
        const hasMemberLayer = await this.repositoryService
            .hasWalletByUUID(
                uuid,
                coin);
        if (hasMemberLayer.error !== eErrorCode.Success) {
            return new Response(hasMemberLayer.error);
        }

        // amount 있는지 비교
        const enterpiseWallet = hasEnterpirseLayer.result as RtWallet;
        const memberWallet = hasMemberLayer.result as RtWallet;

        // todo 이런 부분을 없애고 싶어서 ddd를 하고 싶다.
        if (true === EthUtill.isLessThan(
            memberWallet.balance.amount,
            memberWallet.balance.unit,
            '0',
            memberWallet.balance.unit)) {
            return new Response(eErrorCode.NotEnoughBalance);
        }

        // total = amount + fee
        const total = EthUtill.toWei(
            memberWallet.balance.amount,
            memberWallet.balance.unit).toString();
        // amount
        const amount = EthUtill.sub(
            memberWallet.balance.amount,
            memberWallet.balance.unit,
            this.web3Service.getFeeWei(),
            EtherDefaultUnit).toString();
        // fee
        const fee = this.web3Service.getFeeWei();

        // 토큰 발급
        const rtLayer = await this.repositoryService
            .setPreparedWithraw(
                coin,
                memberWallet.id,
                enterpiseWallet.uuid,
                memberWallet.balance.amount,
                memberWallet.balance.unit,
                enterpiseWallet.address.address);
        if (rtLayer.error !== eErrorCode.Success) {
            return new Response(rtLayer.error);
        }
        const token = rtLayer.result as string;

        // web3 트랜잭션 발생
        const web3Layer = await this.web3Service
            .sendTransaction(
                memberWallet.address.privateKey,
                memberWallet.address.address,
                enterpiseWallet.address.address,
                memberWallet.balance.amount,
                memberWallet.balance.unit);
        if (web3Layer.error !== eErrorCode.Success) {
            // 실패 시 기록
            const recordLayer = await this.repositoryService
                .recordWithrawCancel(token, {
                    type: eHistory.withraw,
                    walletId: memberWallet.id,
                    coin: coin,
                    unit: EtherDefaultUnit,
                    total: total,
                    amount: amount,
                    fee: fee,
                    commission: '0',
                    toFrom: enterpiseWallet.address.address,
                    state: eState.fail
                } as RecordBook);
            if (recordLayer.error !== eErrorCode.Success) {
                return new Response(recordLayer.error);
            }

            return new Response(web3Layer.error);
        }
        const txid = web3Layer.result as string;
        // 성공 시 기록
        const recordLayer = await this.repositoryService
            .recordWithrawRequest(token, {
                txid: txid,
                type: eHistory.withraw,
                walletId: memberWallet.id,
                coin: coin,
                unit: EtherDefaultUnit,
                total: total,
                amount: amount,
                fee: fee,
                commission: '0',
                toFrom: enterpiseWallet.address.address,
                state: eState.request
            } as RecordBook);
        if (recordLayer.error !== eErrorCode.Success) {
            return new Response(recordLayer.error);
        }

        return new Response().to({ state: eState.request, unit: EtherDefaultUnit, total: total, amount: amount, fee: fee, commission: '0' } as IPayload);
    }

    /**
     * 출금 준비 단계
     * @param dto 출금준비 dto
     */
    public async prepareWithdraw(dto: PrepareWithdrawDto): Promise<Response> {
        const coin = Cryptocurrency.get();

        // check has
        const hasMemberWallet = await this.repositoryService
            .hasWalletByUUID(
                dto.uuid,
                coin);
        if (hasMemberWallet.error !== eErrorCode.Success) {
            return new Response(hasMemberWallet.error);
        }

        // check has
        const hasEnterpirseWallet = await this.repositoryService
            .hasEnterpirseWallet(coin);
        if (hasEnterpirseWallet.error !== eErrorCode.Success) {
            return new Response(hasEnterpirseWallet.error);
        }
        // amount 있는지 비교
        const rt = hasEnterpirseWallet.result as RtWallet;
        if (true === EthUtill.isLessThan(
            rt.balance.amount,
            rt.balance.unit,
            dto.amount,
            dto.unit)) {
            return new Response(eErrorCode.NotEnoughBalance);
        }
        // 토큰 발급
        const rtLayer = await this.repositoryService
            .setPreparedWithraw(
                coin,
                rt.id,
                dto.uuid,
                dto.amount,
                dto.unit,
                dto.to.toLowerCase());
        if (rtLayer.error !== eErrorCode.Success) {
            return new Response(rtLayer.error);
        }
        return new Response().to({ token: rtLayer.result } as IPayload);
    }

    /**
     * 출금 요청
     * @param dto 출금 dto
     */
    public async requestWithdraw(dto: WithdrawDto): Promise<Response> {
        const coin = Cryptocurrency.get();

        // 문제점
        // 이런 구조이면 100% 중복 처리 된다. 동시성 때문에

        // check has
        const hasMemberWallet = await this.repositoryService
            .hasWalletByUUID(
                dto.uuid,
                coin);
        if (hasMemberWallet.error !== eErrorCode.Success) {
            return new Response(hasMemberWallet.error);
        }

        // check has
        const hasEnterpirseWallet = await this.repositoryService
            .hasEnterpirseWallet(coin);
        if (hasEnterpirseWallet.error !== eErrorCode.Success) {
            return new Response(hasEnterpirseWallet.error);
        }
        const rt = hasEnterpirseWallet.result as RtWallet;

        // 토큰 유효성 체크
        const prepareLayer = await this.repositoryService
            .getPreparedWithraw(dto.token);
        if (prepareLayer.error !== eErrorCode.Success) {
            return new Response(prepareLayer.error);
        }
        const withraw = prepareLayer.result as RtWithdraw;

        // amount 있는지 비교
        if (true === EthUtill.isLessThan(
            rt.balance.amount,
            rt.balance.unit,
            withraw.amount,
            withraw.unit)) {
            return new Response(eErrorCode.NotEnoughBalance);
        }
        const unit = EtherDefaultUnit;
        // total = amount + fee
        const total = EthUtill.toWei(
            withraw.amount,
            withraw.unit).toString();
        // amount
        const amount = EthUtill.sub(
            withraw.amount,
            withraw.unit,
            this.web3Service.getFeeWei(),
            unit).toString();
        // fee
        const fee = this.web3Service.getFeeWei();

        // web3 트랜잭션 발생
        const web3Layer = await this.web3Service
            .sendTransaction(
                rt.address.privateKey,
                rt.address.address,
                withraw.to,
                withraw.amount,
                withraw.unit);
        if (web3Layer.error !== eErrorCode.Success) {
            // 실패 시 기록
            const recordLayer = await this.repositoryService
                .recordWithrawCancel(dto.token, {
                    type: eHistory.withraw,
                    walletId: rt.id,
                    coin: coin,
                    unit: EtherDefaultUnit,
                    total: total,
                    amount: amount,
                    fee: fee,
                    commission: '0',
                    toFrom: withraw.to,
                    state: eState.fail
                } as RecordBook);
            if (recordLayer.error !== eErrorCode.Success) {
                return new Response(recordLayer.error);
            }
            return new Response(web3Layer.error);
        }
        const txid = web3Layer.result as string;
        // 성공 시 기록
        const recordLayer = await this.repositoryService
            .recordWithrawRequest(dto.token, {
                txid: txid,
                type: eHistory.withraw,
                walletId: rt.id,
                coin: coin,
                unit: unit,
                total: total,
                amount: amount,
                fee: fee,
                commission: '0',
                toFrom: withraw.to,
                state: eState.request
            } as RecordBook);
        if (recordLayer.error !== eErrorCode.Success) {
            return new Response(recordLayer.error);
        }

        return new Response().to({ state: eState.request, unit: EtherDefaultUnit, total: total, amount: amount, fee: fee, commission: '0' } as IPayload);
    }

    /**
     * 거래 기록 조회
     * @param uuid 고유번호
     * @param type 거래타입
     * @param offset 개수
     * @param page 페이지
     */
    public async getHistory(uuid: string, type?: string, offset?: number, page?: number): Promise<Response> {
        const coin = Cryptocurrency.get();

        const rtLayer = await this.repositoryService
            .getHistory(
                uuid,
                coin,
                type,
                offset,
                page);
        if (rtLayer.error !== eErrorCode.Success) {
            return new Response(rtLayer.error);
        }

        // payload
        return new Response().to(rtLayer.result as IPayload);
    }
}