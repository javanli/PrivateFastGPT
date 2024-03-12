import { connectionMongo, ClientSession, sequelize } from './index';

export const mongoSessionRun = async <T = unknown>(fn: (session: ClientSession) => Promise<T>) => {
  const session = await connectionMongo.transaction();
  try {
    const result = await fn(session);

    await session.commit();

    return result as T;
  } catch (error) {
    console.log(error);

    await session.rollback();
    return Promise.reject(error);
  }
};
