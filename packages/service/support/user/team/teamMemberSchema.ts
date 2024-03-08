import { connectionMongo, Model, Schema, model } from '../../../common/mongo';

import { TeamMemberSchema as TeamMemberType } from '@fastgpt/global/support/user/team/type.d';
import { userCollectionName } from '../../user/schema';
import {
  TeamMemberRoleMap,
  TeamMemberStatusMap,
  TeamMemberCollectionName,
  TeamCollectionName
} from '@fastgpt/global/support/user/team/constant';

const TeamMemberSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: userCollectionName,
    required: true
  },
  name: {
    type: String,
    default: 'Member'
  },
  role: {
    type: String,
    enum: Object.keys(TeamMemberRoleMap)
  },
  status: {
    type: String,
    enum: Object.keys(TeamMemberStatusMap)
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  defaultTeam: {
    type: Boolean,
    default: false
  }
});

try {
  TeamMemberSchema.index({ teamId: 1 }, { background: true });
  TeamMemberSchema.index({ userId: 1 }, { background: true });
} catch (error) {
  console.log(error);
}

export const MongoTeamMember: Model<TeamMemberType> = model(
  TeamMemberCollectionName,
  TeamMemberSchema
);
