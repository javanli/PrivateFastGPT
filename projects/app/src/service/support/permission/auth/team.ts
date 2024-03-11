import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { TeamMemberWithUserSchema } from '@fastgpt/global/support/user/team/type';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { checkTeamAIPoints } from '@fastgpt/service/support/permission/teamLimit';
import axios from 'axios';
import { UserModelSchema } from '@fastgpt/global/support/user/type';

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
  const member = await MongoTeamMember.findById(tmbId, 'teamId userId');
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
    const teamInfo = await MongoTeam.findById(shareTeamId);
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
