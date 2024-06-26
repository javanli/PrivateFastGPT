import { connectionMongo, Model, Schema, model } from '../../../common/mongo';

import type { PluginItemSchema } from '@/packages/global/core/plugin/type.d';

import { PluginCollectionName } from '../schema';

export const ModuleCollectionName = 'plugins';

const PluginStoreSchema = new Schema({
  pluginId: {
    type: Schema.Types.ObjectId,
    ref: PluginCollectionName,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  updateTime: {
    type: Date,
    default: () => new Date()
  },
  modules: {
    type: Array,
    default: []
  }
});

export const MongoPluginStore: Model<PluginItemSchema> = model(
  ModuleCollectionName,
  PluginStoreSchema
);
MongoPluginStore.syncIndexes();
