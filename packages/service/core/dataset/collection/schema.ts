import { sqlite3, DataTypes } from '../../../common/mongo';
import { DatasetCollectionSchemaType } from '@fastgpt/global/core/dataset/type.d';
import { TrainingTypeMap, DatasetCollectionTypeMap } from '@fastgpt/global/core/dataset/constants';
import { DatasetCollectionName, MongoDataset } from '../schema';

export const DatasetColCollectionName = 'dataset.collections';

const datesetCollection = sqlite3.define(
  DatasetColCollectionName,
  {
    parentId: {
      type: DataTypes.STRING,
      references: DatasetColCollectionName,
      defaultValue: null
    },
    userId: {
      // abandoned
      type: DataTypes.STRING,
      references: 'user'
    },
    // teamId: {
    //   type: DataTypes.STRING,
    //   references: TeamCollectionName,
    //   allowNull: false
    // },
    // tmbId: {
    //   type: DataTypes.STRING,
    //   references: TeamMemberCollectionName,
    //   allowNull: false
    // },
    datasetId: {
      type: DataTypes.STRING,
      references: {
        model: MongoDataset,
        key: '_id'
      },
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      // enum: Object.keys(DatasetCollectionTypeMap),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createTime: {
      type: DataTypes.DATE,
      defaultValue: () => new Date()
    },
    updateTime: {
      type: DataTypes.DATE,
      defaultValue: () => new Date()
    },

    trainingType: {
      type: DataTypes.STRING,
      // enum: Object.keys(TrainingTypeMap),
      allowNull: false
    },
    chunkSize: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    chunkSplitter: {
      type: DataTypes.STRING
    },
    qaPrompt: {
      type: DataTypes.STRING
    },

    fileId: {
      type: DataTypes.STRING,
      references: 'dataset.files'
    },
    rawLink: {
      type: DataTypes.STRING
    },

    rawTextLength: {
      type: DataTypes.NUMBER
    },
    hashRawText: {
      type: DataTypes.STRING
    },
    metadata: {
      type: DataTypes.STRING,
      defaultValue: {}
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['fileId']
      }
    ]
  }
);
datesetCollection.belongsTo(MongoDataset, { foreignKey: 'userId' });
export const MongoDatasetCollection = datesetCollection;
