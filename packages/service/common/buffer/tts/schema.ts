import { sqlite3, DataTypes } from '../../../common/mongo';

export const collectionName = 'ttsbuffers';

const ttsBuffersTable = sqlite3.define(
  collectionName,
  {
    bufferId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false
    },
    buffer: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    createTime: {
      type: DataTypes.DATE,
      defaultValue: () => new Date()
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['bufferId']
      },
      {
        unique: true,
        fields: ['createTime']
      }
    ]
  }
);

export const MongoTTSBuffer = ttsBuffersTable;
