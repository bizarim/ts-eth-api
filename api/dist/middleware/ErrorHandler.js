"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const wallet_api_eth_common_1 = require("wallet-api-eth-common");
const Logger_1 = require("../middleware/Logger");
let ErrorHandler = class ErrorHandler {
    // Custom error handlers
    error(err, req, res, next) {
        res.status(500).json(new wallet_api_eth_common_1.Response(wallet_api_eth_common_1.eErrorCode.Internal));
        const logger = new Logger_1.Logger();
        logger.error(JSON.stringify(err));
    }
};
ErrorHandler = __decorate([
    routing_controllers_1.Middleware({ type: 'after' })
], ErrorHandler);
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map