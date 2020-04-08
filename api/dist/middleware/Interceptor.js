"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const Logger_1 = require("../middleware/Logger");
let StartAt = class StartAt {
    use(request, response, next) {
        request.startAt = process.hrtime();
        // console.log('StartAt');
        if (undefined !== next) {
            next();
        }
    }
};
StartAt = __decorate([
    routing_controllers_1.Middleware({ type: 'before' })
], StartAt);
exports.StartAt = StartAt;
let EndAt = class EndAt {
    use(request, response, next) {
        // console.log('EndAt');
        if (undefined !== next) {
            const startAt = request.startAt;
            next();
            const endAt = process.hrtime();
            new Logger_1.Logger().debug('ms: ' + ((endAt[0] - startAt[0]) * 1e3 + (endAt[1] - startAt[1]) * 1e-6).toFixed(3));
        }
    }
};
EndAt = __decorate([
    routing_controllers_1.Middleware({ type: 'after' })
], EndAt);
exports.EndAt = EndAt;
//# sourceMappingURL=Interceptor.js.map