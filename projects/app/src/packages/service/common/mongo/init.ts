import { connectionMongo } from './index';

/**
 * connect MongoDB and init data
 */
export async function connectMongo({
  beforeHook,
  afterHook
}: {
  beforeHook?: () => any;
  afterHook?: () => any;
}): Promise<void> {
  if (global.mongodb) {
    return;
  }
  global.mongodb = connectionMongo;

  beforeHook && (await beforeHook());

  console.log('mongo start connect');
  try {
    await connectionMongo.sync();
    console.log('mongo connected');

    afterHook && (await afterHook());
  } catch (error) {
    console.log('error->', 'mongo connect error', error);
    global.mongodb = undefined;
  }
}
