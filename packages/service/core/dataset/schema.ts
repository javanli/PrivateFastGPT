import { sqlite3, DataTypes } from '../../common/mongo';
import {
  DatasetStatusEnum,
  DatasetStatusMap,
  DatasetTypeMap
} from '@fastgpt/global/core/dataset/constants';
import { PermissionTypeEnum, PermissionTypeMap } from '@fastgpt/global/support/permission/constant';

export const DatasetCollectionName = 'datasets';

const DatasetSchema = sqlite3.define(
  DatasetCollectionName,
  {
    parentId: {
      type: DataTypes.STRING,
      // references: DatasetCollectionName,
      defaultValue: null
    },
    // teamId: {
    //   type: DataTypes.STRING,
    //   ref: TeamCollectionName,
    //   allowNull: false
    // },
    // tmbId: {
    //   type: DataTypes.STRING,
    //   ref: TeamMemberCollectionName,
    //   allowNull: false
    // },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'dataset'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: DatasetStatusEnum.active
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: '/icon/logo.svg'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updateTime: {
      type: DataTypes.DATE,
      defaultValue: () => new Date()
    },
    vectorModel: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'text-embedding-ada-002'
    },
    agentModel: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'gpt-3.5-turbo-16k'
    },
    intro: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    permission: {
      type: DataTypes.STRING,
      // enum: Object.keys(PermissionTypeMap),
      defaultValue: PermissionTypeEnum.private
    },
    websiteConfig: {
      type: DataTypes.JSON
      // type: {
      //   url: {
      //     type: DataTypes.STRING,
      //     allowNull: false
      //   },
      //   selector: {
      //     type: DataTypes.STRING,
      //     defaultValue: 'body'
      //   }
      // }
    }
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['teamId']
      }
    ]
  }
);

export const MongoDataset = DatasetSchema;
