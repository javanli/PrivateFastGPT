import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { CreateOnePluginParams } from '@/packages/global/core/plugin/controller';
import { authUserNotVisitor } from '@/packages/service/support/permission/auth/user';
import { MongoPlugin } from '@/packages/service/core/plugin/schema';
import { checkTeamPluginLimit } from '@/packages/service/support/permission/teamLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { teamId, tmbId } = await authUserNotVisitor({ req, authToken: true });
    const body = req.body as CreateOnePluginParams;

    await checkTeamPluginLimit(teamId);

    const { _id } = await MongoPlugin.create({
      ...body,
      teamId,
      tmbId
    });

    jsonRes(res, {
      data: _id
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
