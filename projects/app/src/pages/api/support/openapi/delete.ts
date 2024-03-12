import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoOpenApi } from '@/packages/service/support/openapi/schema';
import { authOpenApiKeyCrud } from '@/packages/service/support/permission/auth/openapi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { id } = req.query as { id: string };

    if (!id) {
      throw new Error('缺少参数');
    }

    await authOpenApiKeyCrud({ req, authToken: true, id, per: 'owner' });

    await MongoOpenApi.destroy({ _id: id });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
