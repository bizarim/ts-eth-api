import WebSocket from 'ws';
import { SequentialTaskQueue } from 'sequential-task-queue';
import { ConfigLoader, Web3Coinfig, MainPath, eConfig, LayerResult, Cryptocurrency, eErrorCode } from 'wallet-api-eth-common';
import Web3 from 'web3';
import { ProcRecord } from './process/ProcRecord';
import { Logger } from './Logger';

const queue = new SequentialTaskQueue();

export class Web3Service {
    private init: boolean = false;
    private ws: WebSocket;
    private web3: Web3;
    private logger: Logger;
    constructor() {
        this.logger = new Logger();
        if (false === this.init) {
            const loader = new ConfigLoader(MainPath.get(), 'config');
            const config = loader.get<Web3Coinfig>(eConfig.web3);
            console.log('ws: ' + config.fastnode.ws);
            console.log('endpoint: ' + config.fastnode.ep);
            this.ws = new WebSocket(config.fastnode.ws);
            this.web3 = new Web3(new Web3.providers.HttpProvider(config.fastnode.ep));
            this.init = true;
        }
    }

    public async test(): Promise<string> {
        return 'test';
    }

    public async sub(): Promise<string> {
        const subscriptionNewHeads = {
            id: 1,
            method: 'eth_subscribe',
            params: ['newHeads']
        };


        this.ws.onopen = () => {
            // 구독하기
            this.ws.send(JSON.stringify(subscriptionNewHeads));
            // ws.send(JSON.stringify(subscriptionNewPendingTransactionss));
        };


        this.ws.onmessage = (ack) => {
            // console.log(blockHeader);
            queue.push(async () => {
                try {
                    // console.log(ack);
                    // console.log(typeof ack.data);
                    // console.log(ack.data);
                    const context = JSON.parse(ack.data as string);
                    if (typeof context.params === 'undefined') return;
                    if (typeof context.params.result === 'undefined') return;
                    if (typeof context.params.result.hash === 'undefined') return;

                    console.log('!= newBlockHeaders =!');
                    console.log(context.params.result.number);
                    console.log(context.params.result.hash);
                    let cbError: Error | undefined | null;
                    const block = await this.web3.eth.getBlock(context.params.result.hash, true, (err, b) => {
                        console.log('!= getBlock =!');
                        this.logger.info(JSON.stringify(err));
                        this.logger.info(JSON.stringify(b));
                        cbError = err;
                    });

                    if (cbError === undefined) return;
                    if (cbError !== null) return;
                    if (block === null) return;
                    new ProcRecord(block.transactions).execute();
                }
                catch (e) {
                    this.logger.error(JSON.stringify(e));
                    console.log(e);
                }
            });
        };

        this.ws.onerror = (e) => {
            this.logger.error(e.message);
            console.log(e.message);
        };

        return 'test';
    }
}
