import {
  TeamItemType,
  TeamMemberWithTeamSchema,
  TeamSchema
} from '@/packages/global/support/user/team/type';
import { ClientSession } from '../../../common/mongo';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  notLeaveStatus
} from '@/packages/global/support/user/team/constant';

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
    _id: '1',
    userId: String(0),
    teamId: String(teamInfo._id),
    teamName: teamInfo.name,
    memberName: '',
    avatar: teamInfo.avatar,
    balance: teamInfo.balance,
    tmbId: '1',
    role: TeamMemberRoleEnum.admin,
    status: TeamMemberStatusEnum.active,
    defaultTeam: true,
    canWrite: true,
    maxSize: teamInfo.maxSize,
    createTime: new Date(0),
    name: ''
  };
}
async function getTeamMember(match: Record<string, any>): Promise<TeamItemType> {
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
  return getDefaultTeamMember();
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
}) {}
