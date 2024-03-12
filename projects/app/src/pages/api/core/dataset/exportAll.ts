import type { NextApiRequest, NextApiResponse } from 'next';
import {
  jsonRes,
  responseWrite,
  responseWriteController
} from '@/packages/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { addLog } from '@/packages/service/common/system/log';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';
import { MongoDatasetData } from '@/packages/service/core/dataset/data/schema';
import { findDatasetAndAllChildren } from '@/packages/service/core/dataset/controller';
import { withNextCors } from '@/packages/service/common/middle/cors';
import {
  checkExportDatasetLimit,
  updateExportDatasetLimit
} from '@/packages/service/support/user/utils';
import { sseResponseEventEnum } from '@/packages/service/common/response/constant';

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    let { datasetId } = req.query as {
      datasetId: string;
    };

    if (!datasetId || !global.pgClient) {
      throw new Error('缺少参数');
    }

    // 凭证校验
    const { teamId } = await authDataset({ req, authToken: true, datasetId, per: 'w' });

    await checkExportDatasetLimit({
      teamId,
      limitMinutes: global.feConfigs?.limit?.exportDatasetLimitMinutes
    });

    const datasets = await findDatasetAndAllChildren({
      teamId,
      datasetId,
      fields: '_id'
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8;');
    res.setHeader('Content-Disposition', 'attachment; filename=dataset.csv; ');

    const results = (
      await MongoDatasetData.sqliteModel.findAll({
        where: {
          teamId,
          datasetId: { $in: datasets.map((d) => d._id) }
        },
        limit: 5000
      })
    ).map((item) => item.dataValues);
    let strResult = `\uFEFFindex,content`;
    for (const doc of results) {
      const q = doc.q.replace(/"/g, '""') || '';
      const a = doc.a.replace(/"/g, '""') || '';
      strResult += `\n"${q}","${a}"`;
    }
    responseWrite({
      res,
      event: sseResponseEventEnum.response,
      data: strResult
    });

    updateExportDatasetLimit(teamId);
  } catch (err) {
    res.status(500);
    addLog.error(`export dataset error`, err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});

export const config = {
  api: {
    responseLimit: '100mb'
  }
};
