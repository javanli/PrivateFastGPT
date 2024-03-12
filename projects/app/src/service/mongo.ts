import { startQueue } from './utils/tools';
import { PRICE_SCALE } from '@/packages/global/support/wallet/constants';
import { connectMongo } from '@/packages/service/common/mongo/init';
import { hashStr } from '@/packages/global/common/string/tools';
import { createDefaultTeam } from '@/packages/service/support/user/team/controller';
import { exit } from 'process';
import { initVectorStore } from '@/packages/service/common/vectorStore/controller';
import { getInitConfig } from '@/pages/api/common/system/getInitData';
import { startCron } from './common/system/cron';
import { mongoSessionRun } from '@/packages/service/common/mongo/sessionRun';
import { getDefaultUser } from '@/packages/service/support/user/controller';

/**
 * connect MongoDB and init data
 */
export function connectToDatabase(): Promise<void> {
  return connectMongo({
    beforeHook: () => {},
    afterHook: async () => {
      initVectorStore();
      // start queue
      startQueue();
      // init system config
      getInitConfig();

      // cron
      startCron();

      initRootUser();
    }
  });
}

async function initRootUser() {
  try {
    const rootUser = getDefaultUser();
    const psw = process.env.DEFAULT_ROOT_PSW || '123456';

    let rootId = rootUser?._id || '';

    console.log(`root user init:`, {
      username: 'root',
      password: psw
    });
  } catch (error) {
    console.log('init root user error', error);
    exit(1);
  }
}
