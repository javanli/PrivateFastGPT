import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoDataset } from '@/packages/service/core/dataset/schema';
import { getVectorModel } from '@/packages/service/core/ai/model';
import type { DatasetListItemType } from '@/packages/global/core/dataset/type.d';
import { mongoRPermission } from '@/packages/global/support/permission/utils';
import { authUserRole } from '@/packages/service/support/permission/auth/user';
import { DatasetTypeEnum } from '@/packages/global/core/dataset/constants';
import { Op } from '@/packages/service/common/mongo';

/* get all dataset by teamId or tmbId */
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    // 凭证校验
    const { teamId, tmbId, teamOwner, role } = await authUserRole({ req, authToken: true });

    const datasets = await MongoDataset.find({
      ...mongoRPermission({ teamId, tmbId, role }),
      type: { [Op.ne]: DatasetTypeEnum.folder }
    });

    const data = datasets.map((item) => ({
      _id: item._id,
      parentId: item.parentId,
      avatar: item.avatar,
      name: item.name,
      intro: item.intro,
      type: item.type,
      permission: item.permission,
      vectorModel: getVectorModel(item.vectorModel),
      canWrite: String(item.tmbId) === tmbId,
      isOwner: teamOwner || String(item.tmbId) === tmbId
    }));

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
