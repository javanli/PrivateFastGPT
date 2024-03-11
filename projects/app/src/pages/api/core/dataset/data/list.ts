import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { DatasetDataListItemType } from '@/global/core/dataset/type.d';
import type { GetDatasetDataListProps } from '@/global/core/api/datasetReq';
import { authDatasetCollection } from '@fastgpt/service/support/permission/auth/dataset';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { PagingData } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    let {
      pageNum = 1,
      pageSize = 10,
      searchText = '',
      collectionId
    } = req.body as GetDatasetDataListProps;

    pageSize = Math.min(pageSize, 30);

    // 凭证校验
    const { teamId, collection } = await authDatasetCollection({
      req,
      authToken: true,
      authApiKey: true,
      collectionId,
      per: 'r'
    });

    searchText = searchText.replace(/'/g, '');

    const match = {
      teamId,
      datasetId: collection.datasetId._id,
      collectionId,
      ...(searchText
        ? {
            $or: [{ q: new RegExp(searchText, 'i') }, { a: new RegExp(searchText, 'i') }]
          }
        : {})
    };
    const data = (
      await MongoDatasetData.sqliteModel.findAll({
        where: match,
        order: [
          ['chunkIndex', 'ASEC'],
          ['updateTime', 'DESC']
        ],
        offset: (pageNum - 1) * pageSize,
        limit: pageSize
      })
    ).map((item) => item.dataValues);
    const total = await MongoDatasetData.countDocuments(match);

    jsonRes<PagingData<DatasetDataListItemType>>(res, {
      data: {
        pageNum,
        pageSize,
        data,
        total
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
