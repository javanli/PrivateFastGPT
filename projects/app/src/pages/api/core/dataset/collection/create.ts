/* 
    Create one dataset collection
*/
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { CreateDatasetCollectionParams } from '@/packages/global/core/dataset/api.d';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';
import { createOneCollection } from '@/packages/service/core/dataset/collection/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const body = req.body as CreateDatasetCollectionParams;

    const { teamId, tmbId } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      datasetId: body.datasetId,
      per: 'w'
    });

    const { _id } = await createOneCollection({
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
