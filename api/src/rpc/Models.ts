export class BtcRpcOpts {
    public user?: string;
    public pwd?: string;
    public endpoint?: string;
    public walletId?: string;
}

export class EthRpcOpts {
    public endpoint?: string;
    public ws?: string;
}

export class RpcRequest {
    public url: string;
    public method: string;
    public body: string;
    public auth: string;
    public timeout: number;
}

export class RpcResponse {
    public error: RpcError | object | undefined;
    public context: RpcContext | undefined;
}

export class RpcError {
    public code: number;
    public message: string;
}

export interface IRpcContext {

}

export class RpcContext implements IRpcContext {
    public error: RpcError | object | undefined;
    public id: string; // string으로 통일 하자
    public jsonrpc: string;
    public result: undefined | string | boolean | object;
}
