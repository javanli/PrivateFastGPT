import {
  ModelCtor,
  Sequelize,
  Model as SeqModel,
  DataTypes,
  ModelAttributeColumnOptions,
  ModelStatic,
  WhereOptions,
  Transaction,
  CreationAttributes,
  Op
} from 'sequelize';
export { Op } from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';

export const sequelize = new Sequelize('sqlite::memory:');
export const connectionMongo = sequelize;
type IndexDirection =
  | 1
  | -1
  | '2d'
  | '2dsphere'
  | 'geoHaystack'
  | 'hashed'
  | 'text'
  | 'ascending'
  | 'asc'
  | 'descending'
  | 'desc';
declare type SchemaType =
  | StringConstructor
  | BufferConstructor
  | DateConstructor
  | NumberConstructor
  | string
  | object;
interface SchemaConfig {
  type?: SchemaType;
  required?: boolean;
  default?: any;
  unique?: boolean;
  get?(val: unknown): unknown;
  set?(val: unknown): void;
  enum?: string[];
  select?: boolean;
  ref?: string;
}
interface WriteOption {
  session?: Transaction;
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
  index(config: Record<string, IndexDirection>, options?: any) {}
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
  async find(options: WhereOptions, filter?: any) {
    const result = await this.sqliteModel.findAll({
      where: options
    });
    return result.map((item) => item.dataValues);
  }
  async findById(id: string, filter?: any) {
    return this.findOne({ _id: id });
  }
  async findByIdAndUpdate(id: string, updateData: any, writeOption?: WriteOption) {
    const model = await this.sqliteModel.findByPk(id, {
      transaction: writeOption?.session
    });
    if (model) {
      const values = { ...(model!.dataValues ?? {}), ...updateData };
      model!.dataValues = values;
      await model!.save({
        transaction: writeOption?.session
      });
    }
  }
  async findByIdAndDelete(id: string, writeOption?: WriteOption) {
    await this.destroy({ _id: id }, writeOption);
  }
  async create(values: any, writeOption?: WriteOption) {
    const result = await this.sqliteModel.create(values, { transaction: writeOption?.session });
    return result.dataValues;
  }
  async destroy(options: WhereOptions, writeOption?: WriteOption) {
    await this.sqliteModel.destroy({
      where: options,
      transaction: writeOption?.session
    });
  }
  async deleteMany(options: WhereOptions, writeOption?: WriteOption) {
    await this.sqliteModel.destroy({
      where: options,
      transaction: writeOption?.session
    });
  }
  async insertMany(options: any, writeOption?: WriteOption) {
    return await this.sqliteModel.bulkCreate(options, {
      transaction: writeOption?.session
    });
  }
  async deleteOne(options: WhereOptions, writeOption?: WriteOption) {
    await this.sqliteModel.destroy({
      where: options,
      transaction: writeOption?.session
    });
  }
  async countDocuments(options: WhereOptions, writeOption?: WriteOption) {
    return await this.sqliteModel.count({
      where: options
    });
  }
  async count(options: WhereOptions, writeOption?: WriteOption) {
    return await this.sqliteModel.count({
      where: options
    });
  }
  async update(options: WhereOptions, data: any) {
    const result = await this.sqliteModel.update(data, {
      where: options,
      returning: true,
      limit: 1
    });
    const model = result[1];
    if (model && model.length > 0) {
      return model[0].dataValues;
    }
    return undefined;
  }
}
function convertType(type?: SchemaType) {
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
  // console.error('error type = ', type);
  return DataTypes.JSON;
}
export function model<M extends {}, T>(name: string, schema?: Schema<T>): Model<M> {
  let attributes: Record<string, ModelAttributeColumnOptions> = {};
  for (const key in schema?.config) {
    if (Object.prototype.hasOwnProperty.call(schema?.config, key)) {
      const element = schema?.config[key] ?? {};
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
        }
        // references: element.ref
      };
      if (element.enum) {
        sqliteSchema.type = DataTypes.ENUM;
        sqliteSchema.values = element.enum;
      }
      attributes[key] = sqliteSchema;
    }
  }
  const modelCtor = sequelize.define(name, attributes);
  modelCtor.sync();
  const wrapper = new Model(modelCtor);
  console.log(`define table: ${name}`);
  return wrapper;
}

export type ClientSession = Transaction;