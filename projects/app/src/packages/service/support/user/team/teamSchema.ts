import { connectionMongo, Model, Schema, model } from '../../../common/mongo';

import { TeamSchema as TeamType } from '@/packages/global/support/user/team/type.d';
import { userCollectionName } from '../schema';
import { TeamCollectionName } from '@/packages/global/support/user/team/constant';

const TeamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: userCollectionName
  },
  avatar: {
    type: String,
    default: '/icon/logo.svg'
  },
  createTime: {
    type: Date,
    default: () => Date.now()
  },
  balance: {
    type: Number,
    default: 0
  },
  maxSize: {
    type: Number,
    default: 1
  },
  tagsUrl: {
    type: String
  },
  'limit.lastExportDatasetTime': {
    type: Date
  },
  'limit.lastWebsiteSyncTime': {
    type: Date
  }
});

try {
  TeamSchema.index({ name: 1 });
  TeamSchema.index({ ownerId: 1 });
} catch (error) {
  console.log(error);
}

export const MongoTeam: Model<TeamType> = model(TeamCollectionName, TeamSchema);
