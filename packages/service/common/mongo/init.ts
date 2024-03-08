import { sqlite3 } from './index';

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
  if (global.sqliteDB) {
    return;
  }

  beforeHook && (await beforeHook());

  console.log('mongo start connect');
  try {
    await sqlite3.sync({ force: true });
    global.sqliteDB = sqlite3;
    console.log('mongo connected');

    afterHook && (await afterHook());
  } catch (error) {
    console.log('error->', 'mongo connect error', error);
    global.sqliteDB = undefined;
  }
}
