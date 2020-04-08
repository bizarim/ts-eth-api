import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { eErrorCode, Response } from 'wallet-api-eth-common';
import { Logger } from '../middleware/Logger';

@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {

    // Custom error handlers
    error(err: any, req: any, res: any, next: (err: any) => any) {
        res.status(500).json(new Response(eErrorCode.Internal));
        const logger = new Logger();
        logger.error(JSON.stringify(err));
    }
}