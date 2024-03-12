import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoDataset } from '@/packages/service/core/dataset/schema';
import type { DatasetUpdateBody } from '@/packages/global/core/dataset/api.d';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { id, parentId, name, avatar, intro, permission, agentModel, websiteConfig, status } =
      req.body as DatasetUpdateBody;

    if (!id) {
      throw new Error('缺少参数');
    }

    if (permission) {
      await authDataset({ req, authToken: true, datasetId: id, per: 'owner' });
    } else {
      await authDataset({ req, authToken: true, datasetId: id, per: 'w' });
    }

    await MongoDataset.update(
      {
        _id: id
      },
      {
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(name && { name }),
        ...(avatar && { avatar }),
        ...(permission && { permission }),
        ...(agentModel && { agentModel: agentModel.model }),
        ...(websiteConfig && { websiteConfig }),
        ...(status && { status }),
        ...(intro && { intro })
      }
    );

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
