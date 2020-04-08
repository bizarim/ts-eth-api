import { RpcResponse, RpcRequest, EthRpcOpts } from './Models';
import { dHttp } from './dHttp';
import { IRpcClient } from './IRpcClient';

let rpcCount = 0;  // global used to prevent duplicates

/**
 * RPC Client
 */
export class EthRpcClinet implements IRpcClient {
    public auth: string;
    public url: string;

    constructor(opts: EthRpcOpts) {
        const { endpoint } = opts;
        if (!endpoint) throw new TypeError('Expected RPC opts.url, got ' + endpoint);
        else this.url = `${endpoint}`;
    }

    public async call(method: string, params: any[], id?: string): Promise<RpcResponse> {
        const req = new RpcRequest();
        req.auth = this.auth;
        req.body = JSON.stringify({ id: undefined === id ? `${rpcCount}` : id, method, params });
        req.method = 'POST';
        req.url = this.url;
        rpcCount = (rpcCount + 1) | 0;  // overflows at UINT32
        return await dHttp(req);
    }
}
