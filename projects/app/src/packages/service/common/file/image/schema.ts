import { TeamCollectionName } from '@/packages/global/support/user/team/constant';
import { connectionMongo, Model, Schema, model } from '../../mongo';
import { MongoImageSchemaType } from '@/packages/global/common/file/image/type.d';
import { mongoImageTypeMap } from '@/packages/global/common/file/image/constants';

const ImageSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  expiredTime: {
    type: Date
  },
  binary: {
    type: Buffer
  },
  type: {
    type: String,
    enum: Object.keys(mongoImageTypeMap),
    required: true
  },

  metadata: {
    type: Object
  }
});

try {
  ImageSchema.index({ expiredTime: 1 }, { expireAfterSeconds: 60 });
  ImageSchema.index({ type: 1 });
  ImageSchema.index({ createTime: 1 });
  ImageSchema.index({ teamId: 1, 'metadata.relatedId': 1 });
} catch (error) {
  console.log(error);
}

export const MongoImage: Model<MongoImageSchemaType> = model('image', ImageSchema);

MongoImage.syncIndexes();
