import { connectionMongo, Model, Schema, model } from '../../../common/mongo';
import { TTSBufferSchemaType } from './type.d';

export const collectionName = 'ttsbuffers';

const TTSBufferSchema = new Schema({
  bufferId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  buffer: {
    type: Buffer,
    required: true
  },
  createTime: {
    type: Date,
    default: () => new Date()
  }
});

try {
  TTSBufferSchema.index({ bufferId: 1 });
  //  24 hour
  TTSBufferSchema.index({ createTime: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoTTSBuffer: Model<TTSBufferSchemaType> = model(collectionName, TTSBufferSchema);
MongoTTSBuffer.syncIndexes();
