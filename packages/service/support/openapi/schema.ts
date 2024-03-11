import { connectionMongo, Model, Schema, model } from '../../common/mongo';

import type { OpenApiSchema } from '@fastgpt/global/support/openapi/type';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';

const OpenApiSchema = new Schema({
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
  apiKey: {
    type: String,
    required: true,
    get: (val: string) => `******${val.substring(val.length - 4)}`
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  lastUsedTime: {
    type: Date
  },
  appId: {
    type: String,
    required: false
  },
  name: {
    type: String,
    default: 'Api Key'
  },
  usagePoints: {
    type: Number,
    default: 0
  },
  expiredTime: {
    type: Date
  },
  maxUsagePoints: {
    type: Number,
    default: -1
  }
});

try {
  OpenApiSchema.index({ teamId: 1 });
  OpenApiSchema.index({ apiKey: 1 });
} catch (error) {
  console.log(error);
}

export const MongoOpenApi: Model<OpenApiSchema> = model('openapi', OpenApiSchema);
MongoOpenApi.syncIndexes();
