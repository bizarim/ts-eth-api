import { InterceptorInterface, Action, Interceptor, ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { ExpressRequestEx, ExpressResponseEx } from './ExpressExtends';
import { Logger } from '../middleware/Logger';

@Middleware({ type: 'before' })
export class StartAt implements ExpressMiddlewareInterface {

    use(request: ExpressRequestEx, response: Express.Response, next?: Function): any {
        request.startAt = process.hrtime();
        // console.log('StartAt');
        if (undefined !== next) {
            next();
        }
    }
}


@Middleware({ type: 'after' })
export class EndAt implements ExpressMiddlewareInterface {

    use(request: ExpressRequestEx, response: Express.Response, next?: Function): any {
        // console.log('EndAt');
        if (undefined !== next) {
            const startAt: [number, number] = request.startAt;
            next();
            const endAt = process.hrtime();
            new Logger().debug('ms: ' + ((endAt[0] - startAt[0]) * 1e3 + (endAt[1] - startAt[1]) * 1e-6).toFixed(3));
        }
    }
}