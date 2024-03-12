import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { connectToDatabase } from '@/service/mongo';
import { getDefaultTeamMember } from '@/packages/service/support/user/team/controller';
import { getDefaultUser } from '@/packages/service/support/user/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { oldPsw, newPsw } = req.body as { oldPsw: string; newPsw: string };

    if (!oldPsw || !newPsw) {
      throw new Error('Params is missing');
    }

    const { tmbId } = await authCert({ req, authToken: true });
    const tmb = getDefaultTeamMember();
    if (!tmb) {
      throw new Error('can not find it');
    }
    const userId = tmb.userId;
    // auth old password
    const user = getDefaultUser();

    if (!user) {
      throw new Error('user.Old password is error');
    }

    // 更新对应的记录

    jsonRes(res, {
      data: {
        user
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
