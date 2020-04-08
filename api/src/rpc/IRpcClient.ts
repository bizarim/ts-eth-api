import { RpcResponse } from './Models';
export interface IRpcClient {
    call(method: string, params: any[], id?: string): Promise<RpcResponse>;

}