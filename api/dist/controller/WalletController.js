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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
const routing_controllers_1 = require("routing-controllers");
const WalletService_1 = require("../service/WalletService");
const dto_1 = require("../dto");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.walletService.test();
        });
    }
    registerEnterprise(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.registerEnterprise(dto.uuid);
        });
    }
    registerMember(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.registerMember(dto.uuid);
        });
    }
    transfer(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.requestTransfer(dto.uuid);
        });
    }
    prepareWithdraw(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.prepareWithdraw(dto);
        });
    }
    withdraw(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.requestWithdraw(dto);
        });
    }
    getBalance(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.getBalance(uuid);
        });
    }
    getHistory(uuid, type, offset, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.getHistory(uuid, type, offset, page);
        });
    }
    getPrimary(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.walletService.getPrimary(uuid);
        });
    }
};
__decorate([
    routing_controllers_1.Get('/test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "test", null);
__decorate([
    routing_controllers_1.Post('/register/enterprise'),
    __param(0, routing_controllers_1.Body({ validate: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateEnterpriseDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "registerEnterprise", null);
__decorate([
    routing_controllers_1.Post('/register/member'),
    __param(0, routing_controllers_1.Body({ validate: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMemberDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "registerMember", null);
__decorate([
    routing_controllers_1.Post('/transfer'),
    __param(0, routing_controllers_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TransferDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "transfer", null);
__decorate([
    routing_controllers_1.Post('/withdraw/prepare'),
    __param(0, routing_controllers_1.Body({ validate: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PrepareWithdrawDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "prepareWithdraw", null);
__decorate([
    routing_controllers_1.Post('/withdraw'),
    __param(0, routing_controllers_1.Body({ validate: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.WithdrawDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdraw", null);
__decorate([
    routing_controllers_1.Get('/:uuid/balance'),
    __param(0, routing_controllers_1.Param('uuid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getBalance", null);
__decorate([
    routing_controllers_1.Get('/:uuid/history'),
    __param(0, routing_controllers_1.Param('uuid')),
    __param(1, routing_controllers_1.QueryParam('type')),
    __param(2, routing_controllers_1.QueryParam('offset')),
    __param(3, routing_controllers_1.QueryParam('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getHistory", null);
__decorate([
    routing_controllers_1.Get('/:uuid/primary'),
    __param(0, routing_controllers_1.Param('uuid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getPrimary", null);
WalletController = __decorate([
    routing_controllers_1.JsonController('/eth/wallet'),
    __metadata("design:paramtypes", [WalletService_1.WalletService])
], WalletController);
exports.WalletController = WalletController;
//# sourceMappingURL=WalletController.js.map