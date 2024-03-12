/* pg vector crud */
import { PgDatasetTableName } from '@fastgpt/global/common/vectorStore/constants';
import { delay } from '@fastgpt/global/common/system/utils';
import { PgClient, connectPg } from './index';
import { PgSearchRawType } from '@fastgpt/global/core/dataset/api';
import { EmbeddingRecallItemType } from '../type';
import { DeleteDatasetVectorProps, EmbeddingRecallProps, InsertVectorProps } from '../controller.d';

export async function initPg() {
  try {
    await connectPg();

    console.log('init pg successful');
  } catch (error) {
    console.log('init pg error', error);
  }
}

export const insertDatasetDataVector = async (
  props: InsertVectorProps & {
    vectors: number[][];
    retry?: number;
  }
): Promise<{ insertId: string }> => {
  const { teamId, datasetId, collectionId, vectors, retry = 3 } = props;

  try {
    const result = await PgClient.insert({
      vectors: vectors[0],
      teamId,
      datasetId,
      collectionId
    });

    return {
      insertId: String(result.lastID)
    };
  } catch (error) {
    if (retry <= 0) {
      return Promise.reject(error);
    }
    await delay(500);
    return insertDatasetDataVector({
      ...props,
      retry: retry - 1
    });
  }
};

export const deleteDatasetDataVector = async (
  props: DeleteDatasetVectorProps & {
    retry?: number;
  }
): Promise<any> => {
  const { teamId, id, datasetIds, collectionIds, idList, retry = 2 } = props;

  try {
    if (id) {
      await PgClient.deleteWithId(id);
    } else if (datasetIds) {
      await pgClient.deleteWithDatasetIds(teamId, datasetIds);
    } else if (collectionIds) {
      await pgClient.deleteWithCollectionIds(teamId, collectionIds);
    } else if (idList) {
      await pgClient.deleteWithIds(idList);
    }
  } catch (error) {
    if (retry <= 0) {
      return Promise.reject(error);
    }
    await delay(500);
    return deleteDatasetDataVector({
      ...props,
      retry: retry - 1
    });
  }
};

export const embeddingRecall = async (
  props: EmbeddingRecallProps & {
    vectors: number[][];
    limit: number;
    retry?: number;
  }
): Promise<{
  results: EmbeddingRecallItemType[];
}> => {
  const { datasetIds, vectors, limit, similarity = 0, retry = 2, efSearch = 100 } = props;

  try {
    const rows = await PgClient.embeddingRecall(vectors[0], datasetIds, limit);

    return {
      results: rows.map((item) => ({
        id: item.id,
        collectionId: item.collectionId,
        score: item.score
      }))
    };
  } catch (error) {
    if (retry <= 0) {
      return Promise.reject(error);
    }
    return embeddingRecall(props);
  }
};

export const getVectorCountByTeamId = async (teamId: string) => {
  const total = await PgClient.teamCount(teamId);

  return total;
};
export const getVectorDataByTime = async (start: Date, end: Date) => {
  const results = await PgClient.queryBetweenTime(start, end);
  return results;
};
