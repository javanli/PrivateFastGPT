import type { Sequelize } from 'sequelize';
import type { Logger } from 'winston';

declare global {
  var mongodb: Sequelize | undefined;
}
