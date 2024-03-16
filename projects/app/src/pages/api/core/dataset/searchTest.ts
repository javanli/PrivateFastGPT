import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/packages/service/common/response';
import { withNextCors } from '@/packages/service/common/middle/cors';
import type { SearchTestProps, SearchTestResponse } from '@/global/core/dataset/api.d';
import { connectToDatabase } from '@/service/mongo';
import { authDataset } from '@/packages/service/support/permission/auth/dataset';
import { searchDatasetData } from '@/service/core/dataset/data/controller';
import { UsageSourceEnum } from '@/packages/global/support/wallet/usage/constants';
import { getLLMModel } from '@/packages/service/core/ai/model';
import { datasetSearchQueryExtension } from '@/packages/service/core/dataset/search/utils';
import {
  checkTeamAIPoints,
  checkTeamReRankPermission
} from '@/packages/service/support/permission/teamLimit';

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    // console.log('search test 1');
    const {
      datasetId,
      text,
      limit = 1500,
      similarity,
      searchMode,
      usingReRank,

      datasetSearchUsingExtensionQuery = false,
      datasetSearchExtensionModel,
      datasetSearchExtensionBg = ''
    } = req.body as SearchTestProps;

    if (!datasetId || !text) {
      throw new Error('缺少参数');
    }
    const start = Date.now();

    // auth dataset role
    const { dataset, teamId, tmbId, apikey } = await authDataset({
      req,
      authToken: true,
      authApiKey: true,
      datasetId,
      per: 'r'
    });
    // console.log('search test 2');
    // auth balance
    await checkTeamAIPoints(teamId);

    // console.log('search test 3');
    // query extension
    const extensionModel =
      datasetSearchUsingExtensionQuery && datasetSearchExtensionModel
        ? getLLMModel(datasetSearchExtensionModel)
        : undefined;
    const { concatQueries, rewriteQuery, aiExtensionResult } = await datasetSearchQueryExtension({
      query: text,
      extensionModel,
      extensionBg: datasetSearchExtensionBg
    });

    // console.log('search test 4');
    const { searchRes, charsLength, ...result } = await searchDatasetData({
      teamId,
      reRankQuery: rewriteQuery,
      queries: concatQueries,
      model: dataset.vectorModel,
      limit: Math.min(limit, 20000),
      similarity,
      datasetIds: [datasetId],
      searchMode,
      usingReRank: usingReRank && (await checkTeamReRankPermission(teamId))
    });
    // console.log('search test 5');
    jsonRes<SearchTestResponse>(res, {
      data: {
        list: searchRes,
        duration: `${((Date.now() - start) / 1000).toFixed(3)}s`,
        usingQueryExtension: !!aiExtensionResult,
        ...result
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});
