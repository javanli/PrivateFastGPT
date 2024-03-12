import { connectionMongo, Model, Schema, model } from '../../mongo';

export const collectionName = 'fileInfo';

const fileInfoSchema = new Schema({
  teamId: {
    type: String,
    required: true
  },
  tmbId: {
    type: String
  },
  fileId: {
    type: String,
    required: true
  },
  fileName: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  contentType: {
    type: String,
    required: true
  }
});
try {
  fileInfoSchema.index({ fileId: 1 });
} catch (error) {
  console.log(error);
}

type FileInfoSchemaType = {
  _id: string;
  fileId: string;
  fileName: string;
  contentType: string;
};
export const FileInfoTable: Model<FileInfoSchemaType> = model(collectionName, fileInfoSchema);
