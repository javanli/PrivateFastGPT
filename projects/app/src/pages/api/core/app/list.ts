import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { mongoRPermission } from '@fastgpt/global/support/permission/utils';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    // 凭证校验
    const { teamId, tmbId, teamOwner, role } = await authUserRole({ req, authToken: true });

    // 根据 userId 获取模型信息
    const myApps = (
      await MongoApp.sqliteModel.findAll({
        where: { ...mongoRPermission({ teamId, tmbId, role }) },
        order: [['updateTime', 'DESC']]
      })
    ).map((data) => data.dataValues);
    jsonRes<AppListItemType[]>(res, {
      data: myApps.map((app) => ({
        _id: app._id,
        avatar: app.avatar,
        name: app.name,
        intro: app.intro,
        isOwner: teamOwner || String(app.tmbId) === tmbId,
        permission: app.permission
      }))
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
