import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { createJWT, setCookie } from '@/packages/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { getDefaultUser, getUserDetail } from '@/packages/service/support/user/controller';
import type { PostLoginProps } from '@/packages/global/support/user/api.d';
import { UserStatusEnum } from '@/packages/global/support/user/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password } = req.body as PostLoginProps;

    if (!username || !password) {
      throw new Error('缺少参数');
    }

    // 检测用户是否存在
    const authCert = getDefaultUser();
    if (!authCert) {
      throw new Error('用户未注册');
    }

    if (authCert.status === UserStatusEnum.forbidden) {
      throw new Error('账号已停用，无法登录');
    }

    const user = getDefaultUser();

    if (!user) {
      throw new Error('密码错误');
    }

    const userDetail = await getUserDetail({
      tmbId: user?.lastLoginTmbId,
      userId: user._id
    });

    const token = createJWT(userDetail);
    setCookie(res, token);

    jsonRes(res, {
      data: {
        user: userDetail,
        token
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
