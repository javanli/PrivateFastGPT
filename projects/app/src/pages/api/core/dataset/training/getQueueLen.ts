import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoDatasetTraining } from '@/packages/service/core/dataset/training/schema';
import { authCert } from '@/packages/service/support/permission/auth/common';
import { GetTrainingQueueProps } from '@/global/core/dataset/api';
import { Op } from '@/packages/service/common/mongo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authToken: true });
    const { vectorModel, agentModel } = req.query as GetTrainingQueueProps;

    // get queue data
    // 分别统计 model = vectorModel和agentModel的数量
    const vectorTrainingCount = await MongoDatasetTraining.sqliteModel.count({
      where: {
        model: vectorModel
      }
    });
    const agentTrainingCount = await MongoDatasetTraining.sqliteModel.count({
      where: {
        model: agentModel
      }
    });

    jsonRes(res, {
      data: {
        vectorTrainingCount,
        agentTrainingCount
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
