import { IndexDirection, IndexOptions } from 'mongoose';
import {
  ModelCtor,
  Sequelize,
  Model as SeqModel,
  DataTypes,
  ModelAttributeColumnOptions,
  ModelStatic,
  WhereOptions
} from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';

const sequelize = new Sequelize('sqlite::memory:');
export const connectionMongo = sequelize;

interface SchemaConfig {
  type: StringConstructor | BufferConstructor | DateConstructor;
  required?: boolean;
  default?: () => any;
}
type SchemaAttributes<T> = {
  [name in keyof T]: SchemaConfig;
};
export class Schema<T> {
  config: SchemaAttributes<T>;
  constructor(config: SchemaAttributes<T>) {
    this.config = config;
  }
  index(config: Record<string, IndexDirection>, options?: IndexOptions) {}
}
export class Model<T extends {}> {
  sqliteModel: ModelCtor<SeqModel<T>>;
  constructor(sqliteModel: ModelCtor<SeqModel<T>>) {
    this.sqliteModel = sqliteModel;
  }
  syncIndexes() {}
  async findOne(options: WhereOptions, filter: any) {
    const result = await this.sqliteModel.findOne({
      where: options
    });
    return result?.dataValues;
  }
  async create(values: any) {
    await this.sqliteModel.create(values);
  }
}
function convertType(type: StringConstructor | BufferConstructor | DateConstructor) {
  if (type === String) {
    return DataTypes.STRING;
  }
  if (type === Buffer) {
    return DataTypes.BLOB;
  }
  if (type === Date) {
    return DataTypes.DATE;
  }
  console.error('error type = ', type);
  return DataTypes.TEXT;
}
export function model<M extends {}, T>(name: string, schema?: Schema<T>): Model<M> {
  let attributes: Record<string, ModelAttributeColumnOptions> = {};
  for (const key in schema?.config) {
    if (Object.prototype.hasOwnProperty.call(schema?.config, key)) {
      const element = schema?.config[key];
      const sqliteSchema: ModelAttributeColumnOptions = {
        type: convertType(element.type),
        allowNull: !element.required,
        defaultValue: element.default || null
      };
      attributes[key] = sqliteSchema;
    }
  }
  const modelCtor = sequelize.define(name, attributes);
  const wrapper = new Model(modelCtor);
  return wrapper;
}
