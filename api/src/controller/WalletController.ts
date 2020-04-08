import { Post, JsonController as Controller, Body, Get, Param, QueryParam } from 'routing-controllers';
import { WalletService } from '../service/WalletService';
import { CreateMemberDto, TransferDto, WithdrawDto, CreateEnterpriseDto, PrepareWithdrawDto } from '../dto';
import { Response, eHistory } from 'wallet-api-eth-common';

@Controller('/eth/wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('/test')
    public async test(): Promise<string> {
        return await this.walletService.test();
    }

    @Post('/register/enterprise')
    public async registerEnterprise(@Body({ validate: true }) dto: CreateEnterpriseDto): Promise<Response> {
        return this.walletService.registerEnterprise(dto.uuid);
    }

    @Post('/register/member')
    public async registerMember(@Body({ validate: true }) dto: CreateMemberDto): Promise<Response> {
        return this.walletService.registerMember(dto.uuid);
    }

    @Post('/transfer')
    public async transfer(@Body() dto: TransferDto): Promise<Response> {
        return this.walletService.requestTransfer(dto.uuid);
    }

    @Post('/withdraw/prepare')
    public async prepareWithdraw(@Body({ validate: true }) dto: PrepareWithdrawDto): Promise<Response> {
        return this.walletService.prepareWithdraw(dto);
    }

    @Post('/withdraw')
    public async withdraw(@Body({ validate: true }) dto: WithdrawDto): Promise<Response> {
        return this.walletService.requestWithdraw(dto);
    }

    @Get('/:uuid/balance')
    public async getBalance(@Param('uuid') uuid: string): Promise<Response> {
        return this.walletService.getBalance(uuid);
    }

    @Get('/:uuid/history')
    public async getHistory(
        @Param('uuid') uuid: string,
        @QueryParam('type') type?: string,
        @QueryParam('offset') offset?: number,
        @QueryParam('page') page?: number
        ): Promise<Response> {
        return this.walletService.getHistory(uuid, type, offset, page);
    }

    @Get('/:uuid/primary')
    public async getPrimary(@Param('uuid') uuid: string): Promise<Response> {
        return this.walletService.getPrimary(uuid);
    }
}
