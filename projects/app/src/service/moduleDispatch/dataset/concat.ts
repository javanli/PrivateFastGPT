import type { SearchDataResponseItemType } from '@/packages/global/core/dataset/type';
import type { ModuleDispatchProps } from '@/packages/global/core/module/type.d';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@/packages/global/core/module/constants';
import { datasetSearchResultConcat } from '@/packages/global/core/dataset/search/utils';
import { filterSearchResultsByMaxChars } from '@/packages/global/core/dataset/search/utils';

type DatasetConcatProps = ModuleDispatchProps<
  {
    [ModuleInputKeyEnum.datasetMaxTokens]: number;
  } & { [key: string]: SearchDataResponseItemType[] }
>;
type DatasetConcatResponse = {
  [ModuleOutputKeyEnum.datasetQuoteQA]: SearchDataResponseItemType[];
};

export async function dispatchDatasetConcat(
  props: DatasetConcatProps
): Promise<DatasetConcatResponse> {
  const {
    params: { limit = 1500, ...quoteMap }
  } = props as DatasetConcatProps;

  const quoteList = Object.values(quoteMap).filter((list) => Array.isArray(list));

  const rrfConcatResults = datasetSearchResultConcat(
    quoteList.map((list) => ({
      k: 60,
      list
    }))
  );

  return {
    [ModuleOutputKeyEnum.datasetQuoteQA]: filterSearchResultsByMaxChars(rrfConcatResults, limit)
  };
}
