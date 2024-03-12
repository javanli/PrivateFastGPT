import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { UsageSourceEnum } from '@/packages/global/support/wallet/usage/constants';
import { CreateTrainingUsageProps } from '@/packages/global/support/wallet/usage/api.d';
import { getLLMModel, getVectorModel } from '@/packages/service/core/ai/model';
import { createTrainingUsage } from '@/packages/service/support/wallet/usage/controller';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { name, datasetId } = req.body as CreateTrainingUsageProps;

    const { teamId, tmbId, dataset } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      datasetId,
      per: 'w'
    });

    const { billId } = await createTrainingUsage({
      teamId,
      tmbId,
      appName: name,
      billSource: UsageSourceEnum.training,
      vectorModel: getVectorModel(dataset.vectorModel).name,
      agentModel: getLLMModel(dataset.agentModel).name
    });

    jsonRes<string>(res, {
      data: billId
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
