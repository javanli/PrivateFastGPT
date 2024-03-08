import { connectionMongo, Model, Schema, model } from '../../mongo';

const FileSchema = new Schema({});

try {
  FileSchema.index({ 'metadata.teamId': 1 });
  FileSchema.index({ 'metadata.uploadDate': -1 });
} catch (error) {
  console.log(error);
}

export const MongoFileSchema = model('dataset.files', FileSchema);

MongoFileSchema.syncIndexes();
