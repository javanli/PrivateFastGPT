import { sqlite3, DataTypes } from '../../../common/mongo';

export const collectionName = 'fileInfo';

export const FileInfoTable = sqlite3.define(
  collectionName,
  {
    teamId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tmbId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contentType: {
      type: DataTypes.STRING,
      allowNull: false
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
