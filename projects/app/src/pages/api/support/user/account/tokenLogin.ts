import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { connectToDatabase } from '@/service/mongo';
import { getUserDetail } from '@/packages/service/support/user/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    jsonRes(res, {
      data: await getUserDetail({ tmbId })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
