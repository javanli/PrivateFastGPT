// import Database from 'better-sqlite3';
import { Sequelize } from 'Sequelize';
// export default Database;
// const db = new Database('PrivateFastGPT.db', { verbose: console.log });
// db.pragma('journal_mode = WAL');
const sequelize = new Sequelize('sqlite::memory:');
export const sqlite3 = sequelize;
export * from 'Sequelize';
