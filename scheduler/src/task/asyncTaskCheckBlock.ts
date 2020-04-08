import Web3 from 'web3';
import { SequentialTaskQueue } from 'sequential-task-queue';
import { Logger } from '../middleware/Logger';
import { ConfigLoader, Web3Coinfig, MainPath, eConfig, Cryptocurrency } from 'wallet-api-eth-common';
import { getRepository } from 'typeorm';
import { SyncedBlock } from 'wallet-eth-repository';
import { ProcRecord } from '../process/ProcRecord';

const queue = new SequentialTaskQueue();

const logger = new Logger();
let loader: ConfigLoader;
let config: Web3Coinfig;
let web3: Web3;
let isSyncing: boolean;

export function asyncTaskCheckBlock() {
    loader = new ConfigLoader(MainPath.get(), 'config');
    config = loader.get<Web3Coinfig>(eConfig.web3);
    web3 = new Web3(new Web3.providers.HttpProvider(config.infura.ep));

    console.log('web3 init');
    console.log('ws: ' + config.fastnode.ws);
    console.log('endpoint: ' + config.fastnode.ep);

    // 마지막 업데이트 시간
    let lastUpdate = new Date();
    let lastBlock = 0;
    // 유효블럭 설정
    const confirms = 10;

    return () => {

        // 코드가 우아하지 않다.!!
        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        // 5분에 한번씩 call
        // mainnet infura에 조금이나마 적게 호출 하기 위해서
        if (diffMins < 5) return;
        if (isSyncing === true) return;
        isSyncing = true;

        // 비동기 큐
        queue.push(async () => {

            // logger.info('async task Check Block-s');
            try {
                const coin = Cryptocurrency.get();
                const blockNumber = await web3.eth.getBlockNumber();
                const syncedBlockRepository = getRepository(SyncedBlock);
                let dbSyncedBlock = await syncedBlockRepository.findOne({ coin: coin });
                if (dbSyncedBlock === undefined) {
                    const abc = new SyncedBlock();
                    abc.coin = coin;
                    abc.height = blockNumber;
                    dbSyncedBlock = await syncedBlockRepository.save(abc);
                }

                // 마지막 기록된 블럭 높이
                lastBlock = dbSyncedBlock.height;

                // 유효블럭 체크
                if ((blockNumber - confirms) < lastBlock) {
                    isSyncing = false;
                    // lastUpdate = new Date();
                    return;
                }

                logger.info(`async task Check Block-${dbSyncedBlock.height < blockNumber}: ${dbSyncedBlock.height},  ${blockNumber}`);

                // 기록 프레세스
                if (dbSyncedBlock.height < blockNumber) {

                    ++dbSyncedBlock.height;

                    for (let i = dbSyncedBlock.height; i <= blockNumber; ++i) {

                        let getBlockCbError: Error | undefined | null;
                        const block = await web3.eth.getBlock(i, true, (err, b) => {
                            getBlockCbError = err;
                            logger.info('!= getBlock =!:' + JSON.stringify(err));
                            logger.info('block height: ' + JSON.stringify(i));
                            // logger.info('block: ' + JSON.stringify(b));
                        });

                        if (getBlockCbError === undefined) continue;
                        if (getBlockCbError !== null || block === null) continue;

                        // 트랜잭션 적용 및 기록
                        await new ProcRecord(i, block.transactions).execute();

                        dbSyncedBlock.height = i;

                        // 블럭 높이 기록
                        await syncedBlockRepository.save(dbSyncedBlock);
                    }

                }

                logger.info('async task Check Block-e');
            } catch (e) {

                logger.info('asyncTaskCheckBlock err: ' + JSON.stringify(e.message));
                logger.info('asyncTaskCheckBlock err: ' + JSON.stringify(e.stack));
            } finally {
                isSyncing = false;
                lastUpdate = new Date();
            }
        });
    };
}
