import { UserErrEnum } from '@/packages/global/common/error/code/user';
import { TeamMemberWithUserSchema } from '@/packages/global/support/user/team/type';
import { checkTeamAIPoints } from '@/packages/service/support/permission/teamLimit';
import axios from 'axios';
import { UserModelSchema } from '@/packages/global/support/user/type';
import {
  getDefaultTeamInfo,
  getDefaultTeamMember
} from '@/packages/service/support/user/team/controller';

function getDefaultUser() {
  const user: UserModelSchema = {
    _id: '0',
    username: '0',
    password: '0',
    avatar: '0',
    balance: 0.7,
    promotionRate: 1.0,
    inviterId: '0',
    openaiKey: '0',
    createTime: 0,
    timezone: '0',
    status: 'active',
    lastLoginTmbId: '0',
    openaiAccount: {
      key: '0',
      baseUrl: '0'
    }
  };
  return user;
}
export async function getUserChatInfoAndAuthTeamPoints(tmbId: string) {
  const member = getDefaultTeamMember();
  if (!member) return Promise.reject(UserErrEnum.unAuthUser);
  let tmb: TeamMemberWithUserSchema = {
    ...member,
    userId: getDefaultUser()
  };
  if (!tmb) return Promise.reject(UserErrEnum.unAuthUser);

  await checkTeamAIPoints(tmb.teamId);

  return {
    user: tmb.userId
  };
}

type UserInfoType = {
  data: {
    uid: '0';
    tags: string[];
  };
};

export async function getShareTeamUid(shareTeamId: string, authToken: string) {
  try {
    const teamInfo = getDefaultTeamInfo();
    const tagsUrl = teamInfo?.tagsUrl;
    const { data: userInfo } = await axios.post(tagsUrl + `/getUserInfo`, { autoken: authToken });

    const uid = userInfo?.data?.uid;
    if (uid) {
      throw new Error('uid null');
    }
    return uid;
  } catch (err) {
    return '';
  }
}
