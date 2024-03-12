import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { FeTeamPlanStatusType } from '@/packages/global/support/wallet/sub/type';
import { getTeamPlanStatus } from '@/packages/service/support/wallet/sub/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    const { teamId } = await authCert({
      req,
      authToken: true
    });

    jsonRes<FeTeamPlanStatusType>(res, {
      data: await getTeamPlanStatus({
        teamId
      })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
