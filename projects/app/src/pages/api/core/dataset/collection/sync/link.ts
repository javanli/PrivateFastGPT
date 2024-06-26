import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authDatasetCollection } from '@/packages/service/support/permission/auth/dataset';
import {
  getCollectionAndRawText,
  reloadCollectionChunks
} from '@/packages/service/core/dataset/collection/utils';
import { delCollectionAndRelatedSources } from '@/packages/service/core/dataset/collection/controller';
import {
  DatasetCollectionSyncResultEnum,
  DatasetCollectionTypeEnum
} from '@/packages/global/core/dataset/constants';
import { DatasetErrEnum } from '@/packages/global/common/error/code/dataset';
import { createTrainingUsage } from '@/packages/service/support/wallet/usage/controller';
import { UsageSourceEnum } from '@/packages/global/support/wallet/usage/constants';
import { getLLMModel, getVectorModel } from '@/packages/service/core/ai/model';
import { createOneCollection } from '@/packages/service/core/dataset/collection/controller';
import { mongoSessionRun } from '@/packages/service/common/mongo/sessionRun';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    const { collectionId } = req.body as { collectionId: string };

    if (!collectionId) {
      throw new Error('CollectionIdId is required');
    }

    const { collection, tmbId } = await authDatasetCollection({
      req,
      authToken: true,
      collectionId,
      per: 'w'
    });

    if (collection.type !== DatasetCollectionTypeEnum.link || !collection.rawLink) {
      return Promise.reject(DatasetErrEnum.unLinkCollection);
    }

    const { title, rawText, isSameRawText } = await getCollectionAndRawText({
      collection
    });

    if (isSameRawText) {
      return jsonRes(res, {
        data: DatasetCollectionSyncResultEnum.sameRaw
      });
    }

    /* Not the same original text, create and reload */

    const vectorModelData = getVectorModel(collection.dataset.vectorModel);
    const agentModelData = getLLMModel(collection.dataset.agentModel);

    await mongoSessionRun(async (session) => {
      // create training bill
      const { billId } = await createTrainingUsage({
        teamId: collection.teamId,
        tmbId,
        appName: 'core.dataset.collection.Sync Collection',
        billSource: UsageSourceEnum.training,
        vectorModel: vectorModelData.name,
        agentModel: agentModelData.name,
        session
      });

      // create a collection and delete old
      const newCol = await createOneCollection({
        teamId: collection.teamId,
        tmbId: collection.tmbId,
        parentId: collection.parentId,
        datasetId: collection.dataset._id,
        name: title || collection.name,
        type: collection.type,
        trainingType: collection.trainingType,
        chunkSize: collection.chunkSize,
        fileId: collection.fileId,
        rawLink: collection.rawLink,
        metadata: collection.metadata,
        createTime: collection.createTime,
        session
      });

      // start load
      await reloadCollectionChunks({
        collection: {
          ...newCol,
          dataset: collection.dataset
        },
        tmbId,
        billId,
        rawText,
        session
      });

      // delete old collection
      await delCollectionAndRelatedSources({
        collections: [collection],
        session
      });
    });

    jsonRes(res, {
      data: DatasetCollectionSyncResultEnum.success
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
