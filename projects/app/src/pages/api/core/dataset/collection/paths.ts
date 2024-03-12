import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { ParentTreePathItemType } from '@/packages/global/common/parentFolder/type.d';
import { getDatasetCollectionPaths } from '@/packages/service/core/dataset/collection/utils';
import { authDatasetCollection } from '@/packages/service/support/permission/auth/dataset';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    const { parentId } = req.query as { parentId: string };

    if (!parentId) {
      return jsonRes(res, {
        data: []
      });
    }

    await authDatasetCollection({ req, authToken: true, collectionId: parentId, per: 'r' });
    const paths = await getDatasetCollectionPaths({
      parentId
    });

    jsonRes<ParentTreePathItemType[]>(res, {
      data: paths
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
