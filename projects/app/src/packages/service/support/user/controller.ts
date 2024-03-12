import { UserModelSchema, UserType } from '@/packages/global/support/user/type';
import {
  getDefaultTeamInfo,
  getDefaultTeamMember,
  getTmbInfoByTmbId,
  getUserDefaultTeam
} from './team/controller';
import { ERROR_ENUM } from '@/packages/global/common/error/errorCode';
import { UserStatusEnum } from '@/packages/global/support/user/constant';

export function getDefaultUser() {
  const defaultUser = {
    _id: '0',
    username: '0',
    avatar: '0',
    balance: 0.7,
    timezone: 'Asia/Shanghai',
    promotionRate: 99999,
    team: getDefaultTeamInfo(),
    password: '123456',
    openaiKey: '11',
    createTime: 0,
    status: UserStatusEnum.active,
    lastLoginTmbId: '0',
    openaiAccount: {
      key: '0',
      baseUrl: 'testtest'
    }
  };
  return defaultUser;
}
export async function authUserExist({ userId, username }: { userId?: string; username?: string }) {
  return getDefaultUser();
}

export async function getUserDetail({
  tmbId,
  userId
}: {
  tmbId?: string;
  userId?: string;
}): Promise<UserType> {
  const tmb = getDefaultTeamMember();
  const user = getDefaultUser();

  if (!user) {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  return {
    _id: user._id,
    username: user.username,
    avatar: user.avatar,
    balance: user.balance,
    timezone: user.timezone,
    promotionRate: user.promotionRate,
    openaiAccount: user.openaiAccount,
    team: tmb
  };
}
