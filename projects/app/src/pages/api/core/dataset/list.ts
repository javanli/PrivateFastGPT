import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { DatasetListItemType } from '@/packages/global/core/dataset/type.d';
import { DatasetTypeEnum } from '@/packages/global/core/dataset/constants';
import { MongoDataset } from '@/packages/service/core/dataset/schema';
import { mongoRPermission } from '@/packages/global/support/permission/utils';
import { authUserRole } from '@/packages/service/support/permission/auth/user';
import { getVectorModel } from '@/packages/service/core/ai/model';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { parentId, type } = req.query as { parentId?: string; type?: `${DatasetTypeEnum}` };
    // 凭证校验
    const { teamId, tmbId, teamOwner, role, canWrite } = await authUserRole({
      req,
      authToken: true,
      authApiKey: true
    });

    const datasets = (
      await MongoDataset.sqliteModel.findAll({
        where: {
          ...mongoRPermission({ teamId, tmbId, role }),
          ...(parentId !== undefined ? { parentId: parentId } : {}),
          ...(type && { type })
        },
        order: [['updateTime', 'DESC']]
      })
    ).map((item) => item.dataValues);
    const data = await Promise.all(
      datasets.map<DatasetListItemType>((item) => ({
        _id: item._id,
        parentId: item.parentId,
        avatar: item.avatar,
        name: item.name,
        intro: item.intro,
        type: item.type,
        permission: item.permission,
        canWrite,
        isOwner: teamOwner || String(item.tmbId) === tmbId,
        vectorModel: getVectorModel(item.vectorModel)
      }))
    );

    jsonRes<DatasetListItemType[]>(res, {
      data
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
