import { connectionMongo, Model, Schema, model } from '../../../common/mongo';

import { TeamTagsSchema as TeamTagsSchemaType } from '@/packages/global/support/user/team/type.d';
import {
  TeamCollectionName,
  TeamTagsCollectionName
} from '@/packages/global/support/user/team/constant';

const TeamTagsSchema = new Schema({
  label: {
    type: String,
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  key: {
    type: String
  },
  createTime: {
    type: Date,
    default: () => new Date()
  }
});

try {
  TeamTagsSchema.index({ teamId: 1 });
} catch (error) {
  console.log(error);
}

export const MongoTeamTags: Model<TeamTagsSchemaType> = model(
  TeamTagsCollectionName,
  TeamTagsSchema
);
