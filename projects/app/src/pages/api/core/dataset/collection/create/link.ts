/* 
    Create one dataset collection
*/
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { LinkCreateDatasetCollectionParams } from '@/packages/global/core/dataset/api.d';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';
import { createOneCollection } from '@/packages/service/core/dataset/collection/controller';
import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum
} from '@/packages/global/core/dataset/constants';
import { checkDatasetLimit } from '@/packages/service/support/permission/teamLimit';
import { predictDataLimitLength } from '@/packages/global/core/dataset/utils';
import { createTrainingUsage } from '@/packages/service/support/wallet/usage/controller';
import { UsageSourceEnum } from '@/packages/global/support/wallet/usage/constants';
import { getLLMModel, getVectorModel } from '@/packages/service/core/ai/model';
import { reloadCollectionChunks } from '@/packages/service/core/dataset/collection/utils';
import { mongoSessionRun } from '@/packages/service/common/mongo/sessionRun';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const {
      link,
      trainingType = TrainingModeEnum.chunk,
      chunkSize = 512,
      chunkSplitter,
      qaPrompt,
      ...body
    } = req.body as LinkCreateDatasetCollectionParams;

    const { teamId, tmbId, dataset } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      datasetId: body.datasetId,
      per: 'w'
    });

    // 1. check dataset limit
    await checkDatasetLimit({
      teamId,
      insertLen: predictDataLimitLength(trainingType, new Array(10))
    });

    const { _id: collectionId } = await mongoSessionRun(async (session) => {
      // 2. create collection
      const collection = await createOneCollection({
        ...body,
        name: link,
        teamId,
        tmbId,
        type: DatasetCollectionTypeEnum.link,

        trainingType,
        chunkSize,
        chunkSplitter,
        qaPrompt,

        rawLink: link,
        session
      });

      // 3. create bill and start sync
      const { billId } = await createTrainingUsage({
        teamId,
        tmbId,
        appName: 'core.dataset.collection.Sync Collection',
        billSource: UsageSourceEnum.training,
        vectorModel: getVectorModel(dataset.vectorModel).name,
        agentModel: getLLMModel(dataset.agentModel).name,
        session
      });

      // load
      await reloadCollectionChunks({
        collection: {
          ...collection,
          datasetId: dataset
        },
        tmbId,
        billId,
        session
      });

      return collection;
    });

    jsonRes(res, {
      data: { collectionId }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
