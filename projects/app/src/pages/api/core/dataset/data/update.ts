import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { withNextCors } from '@/packages/service/common/middle/cors';
import { connectToDatabase } from '@/service/mongo';
import { updateData2Dataset } from '@/service/core/dataset/data/controller';
import { authDatasetData } from '@/service/support/permission/auth/dataset';
import { UpdateDatasetDataProps } from '@/global/core/dataset/api';
import { checkDatasetLimit } from '@/packages/service/support/permission/teamLimit';

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { id, q = '', a, indexes = [] } = req.body as UpdateDatasetDataProps;

    // auth data permission
    const {
      collection: {
        datasetId: { vectorModel }
      },
      teamId,
      tmbId
    } = await authDatasetData({
      req,
      authToken: true,
      authApiKey: true,
      dataId: id,
      per: 'w'
    });

    // auth team balance
    await checkDatasetLimit({
      teamId,
      insertLen: 1
    });

    const { charsLength } = await updateData2Dataset({
      dataId: id,
      q,
      a,
      indexes,
      model: vectorModel
    });
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});
