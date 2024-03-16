import { DatasetDataItemType } from '@/packages/global/core/dataset/type';
import { PgClient } from '@/packages/service/common/vectorStore/pg';
import { MongoDatasetData } from '@/packages/service/core/dataset/data/schema';
import { authDatasetCollection } from '@/packages/service/support/permission/auth/dataset';
import { AuthModeType } from '@/packages/service/support/permission/type';

/* data permission same of collection */
export async function authDatasetData({
  dataId,
  ...props
}: AuthModeType & {
  dataId: string;
}) {
  // get pg data
  const datasetData = await MongoDatasetData.findById(dataId);

  if (!datasetData) {
    return Promise.reject('core.dataset.error.Data not found');
  }

  const result = await authDatasetCollection({
    ...props,
    collectionId: datasetData.collectionId
  });
  const indexes = await PgClient.queryWithDataId(datasetData._id);
  const data: DatasetDataItemType = {
    id: String(datasetData._id),
    teamId: datasetData.teamId,
    q: datasetData.q,
    a: datasetData.a,
    chunkIndex: datasetData.chunkIndex,
    indexes: indexes,
    datasetId: String(datasetData.datasetId),
    collectionId: String(datasetData.collectionId),
    sourceName: result.collection.name || '',
    sourceId: result.collection?.fileId || result.collection?.rawLink,
    isOwner: String(datasetData.tmbId) === result.tmbId,
    canWrite: result.canWrite
  };

  return {
    ...result,
    datasetData: data
  };
}
