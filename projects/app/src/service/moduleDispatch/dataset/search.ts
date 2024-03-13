import type { moduleDispatchResType } from '@/packages/global/core/chat/type.d';
import type { SelectedDatasetType } from '@/packages/global/core/module/api.d';
import type { SearchDataResponseItemType } from '@/packages/global/core/dataset/type';
import type {
  ModuleDispatchProps,
  ModuleDispatchResponse
} from '@/packages/global/core/module/type.d';
import { ModelTypeEnum, getLLMModel, getVectorModel } from '@/packages/service/core/ai/model';
import { searchDatasetData } from '@/service/core/dataset/data/controller';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
import { DatasetSearchModeEnum } from '@/packages/global/core/dataset/constants';
import { getHistories } from '../utils';
import { datasetSearchQueryExtension } from '@/packages/service/core/dataset/search/utils';
import { ChatModuleBillType } from '@/packages/global/support/wallet/bill/type';
import { checkTeamReRankPermission } from '@/packages/service/support/permission/teamLimit';

type DatasetSearchProps = ModuleDispatchProps<{
  [ModuleInputKeyEnum.datasetSelectList]: SelectedDatasetType;
  [ModuleInputKeyEnum.datasetSimilarity]: number;
  [ModuleInputKeyEnum.datasetMaxTokens]: number;
  [ModuleInputKeyEnum.datasetSearchMode]: `${DatasetSearchModeEnum}`;
  [ModuleInputKeyEnum.userChatInput]: string;
  [ModuleInputKeyEnum.datasetSearchUsingReRank]: boolean;
  [ModuleInputKeyEnum.datasetSearchUsingExtensionQuery]: boolean;
  [ModuleInputKeyEnum.datasetSearchExtensionModel]: string;
  [ModuleInputKeyEnum.datasetSearchExtensionBg]: string;
}>;
export type DatasetSearchResponse = ModuleDispatchResponse<{
  [ModuleOutputKeyEnum.datasetIsEmpty]?: boolean;
  [ModuleOutputKeyEnum.datasetUnEmpty]?: boolean;
  [ModuleOutputKeyEnum.datasetQuoteQA]: SearchDataResponseItemType[];
}>;

export async function dispatchDatasetSearch(
  props: DatasetSearchProps
): Promise<DatasetSearchResponse> {
  const {
    teamId,
    histories,
    module,
    params: {
      datasets = [],
      similarity,
      limit = 1500,
      usingReRank,
      searchMode,
      userChatInput,

      datasetSearchUsingExtensionQuery,
      datasetSearchExtensionModel,
      datasetSearchExtensionBg
    }
  } = props as DatasetSearchProps;

  if (!Array.isArray(datasets)) {
    return Promise.reject('Quote type error');
  }

  if (datasets.length === 0) {
    return Promise.reject('core.chat.error.Select dataset empty');
  }

  if (!userChatInput) {
    return Promise.reject('core.chat.error.User input empty');
  }

  // query extension
  const extensionModel =
    datasetSearchUsingExtensionQuery && datasetSearchExtensionModel
      ? getLLMModel(datasetSearchExtensionModel)
      : undefined;
  const { concatQueries, rewriteQuery, aiExtensionResult } = await datasetSearchQueryExtension({
    query: userChatInput,
    extensionModel,
    extensionBg: datasetSearchExtensionBg,
    histories: getHistories(6, histories)
  });

  // console.log(concatQueries, rewriteQuery, aiExtensionResult);

  // get vector
  const vectorModel = getVectorModel(datasets[0]?.vectorModel?.model);

  // start search
  const {
    searchRes,
    charsLength,
    usingSimilarityFilter,
    usingReRank: searchUsingReRank
  } = await searchDatasetData({
    teamId,
    reRankQuery: `${rewriteQuery}`,
    queries: concatQueries,
    model: vectorModel.model,
    similarity,
    limit,
    datasetIds: datasets.map((item) => item.datasetId),
    searchMode,
    usingReRank: usingReRank && (await checkTeamReRankPermission(teamId))
  });

  // count bill results
  // vector
  const { totalPoints, modelName } = {
    totalPoints: 99999999,
    modelName: getLLMModel(vectorModel.model).name
  };
  const responseData: moduleDispatchResType & { totalPoints: number } = {
    totalPoints,
    query: concatQueries.join('\n'),
    model: modelName,
    charsLength,
    similarity: usingSimilarityFilter ? similarity : undefined,
    limit,
    searchMode,
    searchUsingReRank: searchUsingReRank
  };
  const moduleDispatchBills: ChatModuleBillType[] = [
    {
      totalPoints,
      moduleName: module.name,
      model: modelName,
      charsLength
    }
  ];

  if (aiExtensionResult) {
    const { totalPoints, modelName } = {
      totalPoints: 99999999,
      modelName: getLLMModel(aiExtensionResult.model).name
    };

    responseData.totalPoints += totalPoints;
    responseData.charsLength = aiExtensionResult.charsLength;
    responseData.extensionModel = modelName;
    responseData.extensionResult =
      aiExtensionResult.extensionQueries?.join('\n') ||
      JSON.stringify(aiExtensionResult.extensionQueries);

    moduleDispatchBills.push({
      totalPoints,
      moduleName: 'core.module.template.Query extension',
      model: modelName,
      charsLength: aiExtensionResult.charsLength
    });
  }

  return {
    isEmpty: searchRes.length === 0 ? true : undefined,
    unEmpty: searchRes.length > 0 ? true : undefined,
    quoteQA: searchRes,
    responseData,
    moduleDispatchBills
  };
}
