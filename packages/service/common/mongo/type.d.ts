import type { Logger } from 'winston';
import Database from 'better-sqlite3';

declare global {
  var sqliteDB: Database | undefined;
}
