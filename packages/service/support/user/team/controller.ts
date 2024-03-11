import {
  TeamItemType,
  TeamMemberWithTeamSchema,
  TeamSchema
} from '@fastgpt/global/support/user/team/type';
import { ClientSession } from '../../../common/mongo';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  notLeaveStatus
} from '@fastgpt/global/support/user/team/constant';
import { MongoTeamMember } from './teamMemberSchema';
import { MongoTeam } from './teamSchema';

export function getDefaultTeamInfo() {
  const defaultTeamInfo: TeamSchema = {
    _id: '0',
    name: '0',
    ownerId: '0',
    avatar: '',
    createTime: new Date(0),
    balance: 0.6,
    maxSize: 999999999,
    tagsUrl: '',
    'limit.lastExportDatasetTime': new Date(0),
    'limit.lastWebsiteSyncTime': new Date(0)
  };
  return defaultTeamInfo;
}
export function getDefaultTeamMember() {
  const teamInfo = getDefaultTeamInfo();
  return {
    userId: String(0),
    teamId: String(teamInfo._id),
    teamName: teamInfo.name,
    memberName: '',
    avatar: teamInfo.avatar,
    balance: teamInfo.balance,
    tmbId: '0',
    role: TeamMemberRoleEnum.admin,
    status: TeamMemberStatusEnum.active,
    defaultTeam: true,
    canWrite: true,
    maxSize: teamInfo.maxSize
  };
}
async function getTeamMember(match: Record<string, any>): Promise<TeamItemType> {
  // const tmb = (await MongoTeamMember.findOne(match));

  // if (!tmb) {
  //   return Promise.reject('member not exist');
  // }
  return getDefaultTeamMember();
}

export async function getTmbInfoByTmbId({ tmbId }: { tmbId: string }) {
  if (!tmbId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    _id: String(tmbId),
    status: notLeaveStatus
  });
}

export async function getUserDefaultTeam({ userId }: { userId: string }) {
  if (!userId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    userId: userId,
    defaultTeam: true
  });
}
export async function createDefaultTeam({
  userId,
  teamName = 'My Team',
  avatar = '/icon/logo.svg',
  balance,
  maxSize = 5,
  session
}: {
  userId: string;
  teamName?: string;
  avatar?: string;
  balance?: number;
  maxSize?: number;
  session: ClientSession;
}) {
  // auth default team
  const tmb = await MongoTeamMember.findOne({
    userId: userId,
    defaultTeam: true
  });

  if (!tmb) {
    console.log('create default team', userId);

    // create
    const { _id: insertedId } = await MongoTeam.create(
      {
        ownerId: userId,
        name: teamName,
        avatar,
        balance,
        maxSize,
        createTime: new Date()
      },
      { session }
    );
    await MongoTeamMember.create(
      [
        {
          teamId: insertedId,
          userId,
          name: 'Owner',
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          createTime: new Date(),
          defaultTeam: true
        }
      ],
      { session }
    );
  } else {
    console.log('default team exist', userId);
    await MongoTeam.findByIdAndUpdate(tmb.teamId, {
      $set: {
        ...(balance !== undefined && { balance }),
        maxSize
      }
    });
  }
}
