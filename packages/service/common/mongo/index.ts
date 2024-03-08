import { IndexDirection, IndexOptions, Types, Schema as mongooseSchema } from 'mongoose';
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

declare type SchemaType =
  | StringConstructor
  | BufferConstructor
  | DateConstructor
  | NumberConstructor
  | string
  | object;
interface SchemaConfig {
  type: SchemaType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  get?(val: unknown): unknown;
  set?(val: unknown): void;
  enum?: string[];
  select?: boolean;
  ref?: string;
}
type SchemaAttributes<T> = {
  [name in keyof T]: SchemaConfig;
};

export class Schema<T> {
  config: SchemaAttributes<T>;
  static Types = {
    ObjectId: 'ObjectId'
  };
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
  async findOne(options: WhereOptions, filter?: any) {
    const result = await this.sqliteModel.findOne({
      where: options
    });
    return result?.dataValues;
  }
  async create(values: any) {
    await this.sqliteModel.create(values);
  }
  async destroy(options: WhereOptions) {
    await this.sqliteModel.destroy({
      where: options
    });
  }
}
function convertType(type: SchemaType) {
  if (type === String || type === Schema.Types.ObjectId) {
    return DataTypes.STRING;
  }
  if (type === Buffer) {
    return DataTypes.BLOB;
  }
  if (type === Date) {
    return DataTypes.DATE;
  }
  if (type == Number) {
    return DataTypes.NUMBER;
  }
  console.error('error type = ', type);
  return DataTypes.JSON;
}
export function model<M extends {}, T>(name: string, schema?: Schema<T>): Model<M> {
  let attributes: Record<string, ModelAttributeColumnOptions> = {};
  for (const key in schema?.config) {
    if (Object.prototype.hasOwnProperty.call(schema?.config, key)) {
      const element = schema?.config[key];
      let sqliteSchema: ModelAttributeColumnOptions = {
        type: convertType(element.type),
        allowNull: !element.required,
        defaultValue: element.default,
        get() {
          const rawValue = this.getDataValue(key);
          if (element.get) {
            return element.get(rawValue);
          }
          return rawValue;
        },
        set(value) {
          if (element.set) {
            this.setDataValue(key, element.set(value));
          } else {
            this.setDataValue(key, value);
          }
        },
        references: element.ref
      };
      if (element.enum) {
        sqliteSchema.type = DataTypes.ENUM;
        sqliteSchema.values = element.enum;
      }
      attributes[key] = sqliteSchema;
    }
  }
  const modelCtor = sequelize.define(name, attributes);
  const wrapper = new Model(modelCtor);
  return wrapper;
}
