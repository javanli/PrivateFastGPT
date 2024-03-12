import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoOpenApi } from '@/packages/service/support/openapi/schema';
import type { GetApiKeyProps } from '@/global/support/openapi/api';
import { authUserNotVisitor } from '@/packages/service/support/permission/auth/user';
import { authApp } from '@/packages/service/support/permission/auth/app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { appId } = req.query as GetApiKeyProps;

    if (appId) {
      const { tmbId, teamOwner } = await authApp({ req, authToken: true, appId, per: 'w' });

      const findResponse = (
        await MongoOpenApi.find({
          appId,
          ...(!teamOwner && { tmbId })
        })
      ).sort((a, b) => a._id.localeCompare(b._id));

      return jsonRes(res, {
        data: findResponse
      });
    }

    const {
      teamId,
      tmbId,
      isOwner: teamOwner
    } = await authUserNotVisitor({ req, authToken: true });

    const findResponse = (
      await MongoOpenApi.find({
        appId,
        teamId,
        ...(!teamOwner && { tmbId })
      })
    ).sort((a, b) => a._id.localeCompare(b._id));

    return jsonRes(res, {
      data: findResponse
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
