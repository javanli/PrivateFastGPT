import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import {
  DatasetTrainingCollectionName,
  MongoDatasetTraining
} from '@fastgpt/service/core/dataset/training/schema';
import type { DatasetCollectionsListItemType } from '@/global/core/dataset/type.d';
import type { GetDatasetCollectionsProps } from '@/global/core/api/datasetReq';
import { PagingData } from '@/types';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { DatasetCollectionTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { startQueue } from '@/service/utils/tools';
import { authDataset } from '@fastgpt/service/support/permission/auth/dataset';
import { DatasetDataCollectionName } from '@fastgpt/service/core/dataset/data/schema';
import { Op } from '@fastgpt/service/common/mongo';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    let {
      pageNum = 1,
      pageSize = 10,
      datasetId,
      parentId = null,
      searchText = '',
      selectFolder = false,
      simple = false
    } = req.body as GetDatasetCollectionsProps;
    searchText = searchText?.replace(/'/g, '');
    pageSize = Math.min(pageSize, 30);

    // auth dataset and get my role
    const { teamId, tmbId, canWrite } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      datasetId,
      per: 'r'
    });

    const match = {
      teamId: teamId,
      datasetId: datasetId,
      parentId: parentId ? parentId : undefined,
      ...(selectFolder ? { type: DatasetCollectionTypeEnum.folder } : {}),
      ...(searchText
        ? {
            name: {
              [Op.iRegexp]: searchText
            }
          }
        : {})
    };

    // not count data amount
    if (simple) {
      const collections = (
        await MongoDatasetCollection.sqliteModel.findAll({
          where: match,
          order: ['updateTime', 'DESC']
        })
      ).map((item) => item.dataValues);

      return jsonRes<PagingData<DatasetCollectionsListItemType>>(res, {
        data: {
          pageNum,
          pageSize,
          data: collections.map((item) => ({
            ...item,
            dataAmount: 0,
            trainingAmount: 0,
            canWrite // admin or team owner can write
          })),
          total: collections.length ?? 0
        }
      });
    }
    const total = await MongoDatasetCollection.sqliteModel.count({
      where: match
    });
    const datas = (
      await MongoDatasetCollection.sqliteModel.findAll({
        where: match,
        order: [['updateTime', 'DESC']],
        offset: (pageNum - 1) * pageSize,
        limit: pageSize
      })
    ).map((item) => item.dataValues);

    const data: DatasetCollectionsListItemType[] = datas.map((collection) => {
      return {
        ...collection,
        dataAmount: 0,
        trainingAmount: 0,
        canWrite
      };
    });
    for (const item of data) {
      item.trainingAmount = await MongoDatasetTraining.sqliteModel.count({
        where: {
          teamId,
          collectionId: item._id
        }
      });
      item.dataAmount = await MongoDatasetTraining.sqliteModel.count({
        where: {
          teamId,
          collectionId: item._id,
          datasetId
        }
      });
      item.canWrite = item.tmbId === tmbId || canWrite;
    }

    if (data.find((item) => item.trainingAmount > 0)) {
      startQueue();
    }

    // count collections
    jsonRes<PagingData<DatasetCollectionsListItemType>>(res, {
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
