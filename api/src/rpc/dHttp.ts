import * as url from 'url';
import * as https from 'https';
import { RpcRequest, RpcResponse, RpcContext } from './Models';
// import * as https from 'https';

export function dHttp(opts: RpcRequest): Promise<RpcResponse> {
    let called: boolean = false;
    const errmsg: string = '[JSON-RPC ERROR] ';

    const options = {};
    let auth = opts.auth;
    if (undefined === auth) auth = '';
    opts.timeout = 15000;

    // options setting
    Object.assign(options, opts);
    Object.assign(options, url.parse(opts.url));

    return new Promise((resolve, reject) => {

        try {
            const req = https.request(options, function (res) {

                let buf: string = '';
                res.on('data', function (data) {
                    buf += data;
                });

                res.on('end', function () {

                    if (called) return;
                    try {
                        called = true;
                        // console.log('status code: ' + res.statusCode)
                        if (res.statusCode === 401) {
                            const rpcRes = new RpcResponse();
                            rpcRes.error = { code: res.statusCode, message: errmsg + res.statusCode };
                            // rpcRes.context = {};
                            resolve(rpcRes);
                            return;
                        }
                        if (res.statusCode === 403) {
                            const rpcRes = new RpcResponse();
                            rpcRes.error = { code: res.statusCode, message: errmsg + res.statusCode };
                            // rpcRes.context = {};
                            resolve(rpcRes);
                            return;
                        }
                    } catch (ex) {
                        console.log(ex);
                    }
                    // if (res.statusCode === 500) {
                    //   const rpcRes = new RpcResponse();
                    //   rpcRes.error = { code: res.statusCode, message: errmsg + res.statusCode };
                    //   rpcRes.context = JSON.parse(buf);
                    //   resolve(rpcRes);
                    //   return;
                    // }
                    // todoW Work que depth exceeded
                    // if (buf.toString('utf8') === 'Work queue depth exceeded') {
                    //   let exceededError = new Error('Bitcoin JSON-RPC: ' + buf.toString('utf8'))
                    //   // exceededError.code = 429 // Too many requests
                    //   reject(exceededError)
                    //   return
                    // }

                    let parsedBuf: RpcContext;
                    try {
                        parsedBuf = JSON.parse(buf);
                        // console.log('parsedBuf: ' + JSON.parse(buf))
                    } catch (e) {
                        // todo log
                        const rpcRes = new RpcResponse();
                        rpcRes.error = { code: -999, message: errmsg + 'Error Parsing JSON' };
                        if (e instanceof Error) {
                            console.log(e.message);
                            console.log(e.stack);
                        } else {
                            console.log(e);
                        }
                        // rpcRes.context = {};
                        reject(rpcRes);
                        return;
                    }

                    const rpcRes = new RpcResponse();
                    rpcRes.error = parsedBuf.error;
                    rpcRes.context = parsedBuf;
                    resolve(rpcRes);

                });
            });

            req.on('error', function (e: Error) {
                const rpcRes = new RpcResponse();
                try {
                    rpcRes.error = { code: -99, message: errmsg + 'Request Error: ' + e.message };
                } catch (ex) {
                    console.log(ex);
                }

                reject(rpcRes);
            });

            // req.on('timeout', () => {
            //     try {
            //         req.abort();
            //         const rpcRes = new RpcResponse();
            //         rpcRes.error = { code: -1, message: errmsg + 'Timeout Error' };
            //         reject(rpcRes);
            //     } catch (ex) {
            //         console.log(ex);
            //     }
            // });

            req.setHeader('Content-Length', opts.body.length);
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Connection', 'keep-alive');
            req.setHeader('Authorization', auth);
            req.write(opts.body);
            req.end();

        } catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
                console.log(e.stack);
            } else {
                console.log(e);
            }
            const rpcRes = new RpcResponse();
            rpcRes.error = { code: -1, message: errmsg + 'http Error' };
            reject(rpcRes);
        }
    });
}
