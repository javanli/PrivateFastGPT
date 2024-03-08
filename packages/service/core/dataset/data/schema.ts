import { connectionMongo, Model, Schema, model } from '../../../common/mongo';

import { DatasetDataSchemaType } from '@fastgpt/global/core/dataset/type.d';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';
import { DatasetCollectionName } from '../schema';
import { DatasetColCollectionName } from '../collection/schema';

export const DatasetDataCollectionName = 'dataset.datas';

const DatasetDataSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  tmbId: {
    type: Schema.Types.ObjectId,
    ref: TeamMemberCollectionName,
    required: true
  },
  datasetId: {
    type: Schema.Types.ObjectId,
    ref: DatasetCollectionName,
    required: true
  },
  collectionId: {
    type: Schema.Types.ObjectId,
    ref: DatasetColCollectionName,
    required: true
  },
  q: {
    type: String,
    required: true
  },
  a: {
    type: String,
    default: ''
  },
  fullTextToken: {
    type: String,
    default: ''
  },
  indexes: {
    type: [
      {
        defaultIndex: {
          type: Boolean,
          default: false
        },
        dataId: {
          type: String,
          required: true
        },
        text: {
          type: String,
          required: true
        }
      }
    ],
    default: []
  },

  updateTime: {
    type: Date,
    default: () => new Date()
  },
  chunkIndex: {
    type: Number,
    default: 0
  },
  inited: {
    type: Boolean
  }
});

try {
  // list collection and count data; list data
  DatasetDataSchema.index(
    { teamId: 1, datasetId: 1, collectionId: 1, chunkIndex: 1, updateTime: -1 },
    { background: true }
  );
  // same data check
  DatasetDataSchema.index({ teamId: 1, collectionId: 1, q: 1, a: 1 }, { background: true });
  // full text index
  DatasetDataSchema.index({ teamId: 1, datasetId: 1, fullTextToken: 'text' }, { background: true });
  // Recall vectors after data matching
  DatasetDataSchema.index({ teamId: 1, datasetId: 1, 'indexes.dataId': 1 }, { background: true });
  DatasetDataSchema.index({ updateTime: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoDatasetData: Model<DatasetDataSchemaType> =
  models[DatasetDataCollectionName] || model(DatasetDataCollectionName, DatasetDataSchema);
MongoDatasetData.syncIndexes();