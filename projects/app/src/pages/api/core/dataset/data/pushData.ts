/* push data to training queue */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { withNextCors } from '@/packages/service/common/middle/cors';
import type {
  PushDatasetDataProps,
  PushDatasetDataResponse
} from '@/packages/global/core/dataset/api.d';
import { authDatasetCollection } from '@/packages/service/support/permission/auth/dataset';
import { checkDatasetLimit } from '@/packages/service/support/permission/teamLimit';
import { predictDataLimitLength } from '@/packages/global/core/dataset/utils';
import { pushDataToTrainingQueue } from '@/service/core/dataset/data/controller';

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { collectionId, data } = req.body as PushDatasetDataProps;

    if (!collectionId || !Array.isArray(data)) {
      throw new Error('collectionId or data is empty');
    }

    if (data.length > 200) {
      throw new Error('Data is too long, max 200');
    }

    // 凭证校验
    const { teamId, tmbId, collection } = await authDatasetCollection({
      req,
      authToken: true,
      authApiKey: true,
      collectionId,
      per: 'w'
    });

    // auth dataset limit
    await checkDatasetLimit({
      teamId,
      insertLen: predictDataLimitLength(collection.trainingType, data)
    });

    jsonRes<PushDatasetDataResponse>(res, {
      data: await pushDataToTrainingQueue({
        ...req.body,
        teamId,
        tmbId
      })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: '12mb'
  }
};
