import { connectionMongo, Model, Schema, model } from '../../common/mongo';

import { OutLinkSchema as SchemaType } from '@fastgpt/global/support/outLink/type';
import { OutLinkTypeEnum } from '@fastgpt/global/support/outLink/constant';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';

const OutLinkSchema = new Schema({
  shareId: {
    type: String,
    required: true
  },
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
  appId: {
    type: Schema.Types.ObjectId,
    ref: 'model',
    required: true
  },
  type: {
    type: String,
    default: OutLinkTypeEnum.share
  },
  name: {
    type: String,
    required: true
  },
  usagePoints: {
    type: Number,
    default: 0
  },
  lastTime: {
    type: Date
  },
  responseDetail: {
    type: Boolean,
    default: false
  },
  limit: {
    maxUsagePoints: {
      type: Number,
      default: -1
    },
    expiredTime: {
      type: Date
    },
    QPM: {
      type: Number,
      default: 1000
    },
    hookUrl: {
      type: String
    }
  }
});

try {
  OutLinkSchema.index({ shareId: -1 });
} catch (error) {
  console.log(error);
}

export const MongoOutLink: Model<SchemaType> =
  models['outlinks'] || model('outlinks', OutLinkSchema);

MongoOutLink.syncIndexes();
